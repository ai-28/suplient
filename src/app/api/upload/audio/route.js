import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Initialize S3 client dynamically (same as library uploads)
function getS3Client() {
    return new S3Client({
        endpoint: `https://${process.env.DO_SPACES_REGION}.${process.env.DO_SPACES_ENDPOINT}`,
        region: process.env.DO_SPACES_REGION,
        credentials: {
            accessKeyId: process.env.DO_SPACES_KEY,
            secretAccessKey: process.env.DO_SPACES_SECRET,
        },
        forcePathStyle: true,
    });
}

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

        // Validate environment variables
        const requiredEnvVars = [
            'DO_SPACES_REGION',
            'DO_SPACES_ENDPOINT',
            'DO_SPACES_BUCKET',
            'DO_SPACES_KEY',
            'DO_SPACES_SECRET'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error('❌ Missing environment variables:', missingVars);
            return NextResponse.json({
                success: false,
                error: 'Server configuration error: Missing DigitalOcean Spaces credentials',
                missingVars
            }, { status: 500 });
        }

        console.log('✅ Environment variables OK:', {
            region: process.env.DO_SPACES_REGION,
            endpoint: process.env.DO_SPACES_ENDPOINT,
            bucket: process.env.DO_SPACES_BUCKET,
            hasKey: !!process.env.DO_SPACES_KEY,
            hasSecret: !!process.env.DO_SPACES_SECRET
        });

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

        let audioUrl;
        let uploadMethod = 'spaces';

        // Try uploading to DigitalOcean Spaces first
        try {
            console.log('📤 Uploading voice message to DigitalOcean Spaces:', filePath);

            const s3Client = getS3Client();
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
            audioUrl = getCdnUrl(filePath);

            console.log('✅ Voice message uploaded successfully to Spaces:', fileName);
            console.log('🔗 CDN URL:', audioUrl);
        } catch (spacesError) {
            // Fallback to local storage if Spaces fails
            console.warn('⚠️ DigitalOcean Spaces upload failed, falling back to local storage:', spacesError.message);

            const uploadsDir = join(process.cwd(), 'public', 'uploads', 'audio');
            await mkdir(uploadsDir, { recursive: true });

            const localFilePath = join(uploadsDir, fileName);
            await writeFile(localFilePath, buffer);

            audioUrl = `/uploads/audio/${fileName}`;
            uploadMethod = 'local';

            console.log('✅ Voice message saved locally:', fileName);
            console.log('🔗 Local URL:', audioUrl);
        }

        return NextResponse.json({
            success: true,
            audioUrl,
            fileName,
            fileSize: buffer.length,
            fileType: audioFile.type,
            uploadMethod // 'spaces' or 'local'
        });

    } catch (error) {
        console.error('❌ Error uploading audio to DigitalOcean Spaces:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            statusCode: error.$metadata?.httpStatusCode,
            stack: error.stack
        });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to upload audio file',
                details: error.message
            },
            { status: 500 }
        );
    }
}
