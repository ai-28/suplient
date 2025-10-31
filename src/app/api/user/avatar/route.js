import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
    endpoint: `https://${process.env.DO_SPACES_REGION}.${process.env.DO_SPACES_ENDPOINT}`,
    region: process.env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
    forcePathStyle: true,
});

// Helper function to generate CDN URL
const getCdnUrl = (filePath) => {
    if (process.env.DO_SPACES_CDN_ENABLED === 'true') {
        return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.cdn.${process.env.DO_SPACES_ENDPOINT}/${filePath}`;
    }
    return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.${process.env.DO_SPACES_ENDPOINT}/${filePath}`;
};

// Extract file path from CDN URL for deletion
const extractFilePathFromUrl = (url) => {
    try {
        const urlObj = new URL(url);
        // Remove leading slash from pathname
        return urlObj.pathname.substring(1);
    } catch {
        return null;
    }
};

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check S3 credentials
        if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET || !process.env.DO_SPACES_BUCKET) {
            console.error('❌ Missing DigitalOcean Spaces credentials!');
            return NextResponse.json(
                { success: false, error: 'Server configuration error: Missing S3 credentials' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('avatar');

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: 'File size too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Get current user to check for existing avatar
        const userResult = await sql`
            SELECT avatar FROM "User" WHERE id = ${session.user.id}
        `;

        const oldAvatarUrl = userResult[0]?.avatar;

        // Generate unique filename with proper extension
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `avatar-${session.user.id}-${uuidv4()}.${fileExtension}`;
        const filePath = `avatars/${fileName}`;

        // Convert file to buffer
        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        // Upload to DigitalOcean Spaces
        const command = new PutObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: filePath,
            Body: fileBuffer,
            ContentType: file.type,
            ACL: 'public-read',
            ContentLength: file.size,
            CacheControl: 'max-age=31536000', // Cache for 1 year
        });

        await s3Client.send(command);
        const avatarUrl = getCdnUrl(filePath);

        // Update user record with new avatar URL
        const updateResult = await sql`
            UPDATE "User"
            SET avatar = ${avatarUrl}, "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${session.user.id}
            RETURNING id, name, email, avatar
        `;

        // Delete old avatar from S3 if it exists
        if (oldAvatarUrl) {
            try {
                const oldFilePath = extractFilePathFromUrl(oldAvatarUrl);
                if (oldFilePath && oldFilePath.includes('avatars/')) {
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: process.env.DO_SPACES_BUCKET,
                        Key: oldFilePath,
                    });
                    await s3Client.send(deleteCommand);
                    console.log('✅ Old avatar deleted from S3:', oldFilePath);
                }
            } catch (deleteError) {
                console.warn('⚠️ Failed to delete old avatar:', deleteError);
                // Don't fail the upload if deletion fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatarUrl: avatarUrl,
            user: updateResult[0]
        });

    } catch (error) {
        console.error('Error uploading avatar:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to upload avatar' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get current user avatar URL
        const userResult = await sql`
            SELECT avatar FROM "User" WHERE id = ${session.user.id}
        `;

        const avatarUrl = userResult[0]?.avatar;

        // Remove avatar from database
        await sql`
            UPDATE "User"
            SET avatar = NULL, "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${session.user.id}
        `;

        // Delete avatar from S3 if it exists
        if (avatarUrl) {
            try {
                const filePath = extractFilePathFromUrl(avatarUrl);
                if (filePath && filePath.includes('avatars/')) {
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: process.env.DO_SPACES_BUCKET,
                        Key: filePath,
                    });
                    await s3Client.send(deleteCommand);
                    console.log('✅ Avatar deleted from S3:', filePath);
                }
            } catch (deleteError) {
                console.warn('⚠️ Failed to delete avatar from S3:', deleteError);
                // Don't fail if deletion fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Avatar deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting avatar:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete avatar' },
            { status: 500 }
        );
    }
}

