import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption";
import { saveVideo, getAllVideos, getAllVideosForCoach } from "../../../lib/db/resourceRepo.js";
import { userRepo } from "@/app/lib/db/userRepo";
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import http from 'http';

// Create a custom HTTPS agent with debug logging
const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 50,
    rejectUnauthorized: true,
    timeout: 30000,
    proxy: false
});

// Add debug logging to the agent
httpsAgent.on('error', (err) => {
    console.error('HTTPS Agent Error:', err);
});

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
    endpoint: `https://${process.env.DO_SPACES_REGION}.${process.env.DO_SPACES_ENDPOINT}`,
    region: process.env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
    forcePathStyle: true,
    maxAttempts: 3,
    requestTimeout: 30000,
    connectTimeout: 10000,
    logger: console,
    tls: true,
    useDualstackEndpoint: false,
    useGlobalEndpoint: false,
    requestHandler: {
        httpsAgent
    }
});

// Helper function to generate CDN URL
const getCdnUrl = (filePath) => {
    if (process.env.DO_SPACES_CDN_ENABLED === 'true') {
        return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.cdn.${process.env.DO_SPACES_ENDPOINT}/${filePath}`;
    }
    return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.${process.env.DO_SPACES_ENDPOINT}/${filePath}`;
};

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const email = session.user.email;
        const user = await userRepo.getUserByEmail(email);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        let videos;
        if (user.role === "admin") {
            videos = await getAllVideos();
        } else if (user.role === "coach") {
            videos = await getAllVideosForCoach();
        }

        return NextResponse.json({ status: true, videos });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('video');
        const title = formData.get('title');
        const description = formData.get('description') || '';
        const role = formData.get('role') || 'coach';

        if (!file) {
            return NextResponse.json(
                { status: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `library/videos/${fileName}`;

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

        try {
            await s3Client.send(command);
            // Generate public URL using CDN if enabled
            const publicUrl = getCdnUrl(filePath);
            // Save to database
            const email = session.user.email;
            const user = await userRepo.getUserByEmail(email);
            const video = await saveVideo(
                title,
                user.id,
                "video",
                publicUrl,
                description,
                '',
                file.size,
                file.type
            );

            return NextResponse.json({
                status: true,
                message: 'Video uploaded successfully',
                data: {
                    url: publicUrl,
                    filename: fileName,
                    video
                },
            });
        } catch (uploadError) {
            console.error('Upload error details:', {
                error: uploadError,
                message: uploadError.message,
                code: uploadError.code,
                endpoint: s3Client.config.endpoint,
                bucket: process.env.DO_SPACES_BUCKET,
                fileSize: file.size,
                fileType: file.type
            });
            throw uploadError;
        }
    } catch (error) {
        console.error('Upload error:', {
            error: error.message,
            code: error.code,
            stack: error.stack
        });
        return NextResponse.json(
            {
                status: false,
                message: 'Failed to upload video',
                error: error.message
            },
            { status: 500 }
        );
    }
}
