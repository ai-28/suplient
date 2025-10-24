import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client for DigitalOcean Spaces (same as library uploads)
const s3Client = new S3Client({
    endpoint: `https://${process.env.DO_SPACES_REGION}.${process.env.DO_SPACES_ENDPOINT}`,
    region: process.env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
    forcePathStyle: true,
});

// Helper function to generate CDN URL (same as library uploads)
const getCdnUrl = (filePath) => {
    if (process.env.DO_SPACES_CDN_ENABLED === 'true') {
        return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.cdn.${process.env.DO_SPACES_ENDPOINT}/${filePath}`;
    }
    return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.${process.env.DO_SPACES_ENDPOINT}/${filePath}`;
};

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const audioFile = formData.get('audio');

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        // Validate file type
        if (!audioFile.type.startsWith('audio/')) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        // Validate file size (max 10MB for voice messages)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (audioFile.size > maxSize) {
            return NextResponse.json({
                error: 'File too large. Maximum size is 10MB.'
            }, { status: 400 });
        }

        // Generate unique filename
        const fileExtension = audioFile.type.split('/')[1] || 'wav';
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `chat/voice-messages/${fileName}`;

        // Convert file to buffer
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log('📤 Uploading voice message to DigitalOcean Spaces:', filePath);

        // Upload to DigitalOcean Spaces (same as library uploads)
        const command = new PutObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: filePath,
            Body: buffer,
            ContentType: audioFile.type,
            ACL: 'public-read',
            ContentLength: audioFile.size,
            CacheControl: 'max-age=31536000', // Cache for 1 year (same as library files)
        });

        await s3Client.send(command);

        // Get CDN URL (same as library uploads)
        const audioUrl = getCdnUrl(filePath);

        console.log('✅ Voice message uploaded successfully:', fileName);
        console.log('🔗 CDN URL:', audioUrl);

        return NextResponse.json({
            success: true,
            audioUrl,
            fileName,
            fileSize: buffer.length,
            fileType: audioFile.type
        });

    } catch (error) {
        console.error('Error uploading audio:', error);
        return NextResponse.json(
            { error: 'Failed to upload audio file' },
            { status: 500 }
        );
    }
}
