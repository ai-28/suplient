import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption";
import { s3Client, generatePresignedUrl, getCdnUrl, configureCORS, createMultipartUpload } from "@/app/lib/s3Client";
import { v4 as uuidv4 } from 'uuid';

// Track if CORS has been configured (to avoid repeated calls)
let corsConfigured = false;

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
    videos: 1.5 * 1024 * 1024 * 1024,   // 1.5GB
    images: 50 * 1024 * 1024,     // 50MB
    articles: 100 * 1024 * 1024,  // 100MB
    sounds: 200 * 1024 * 1024,    // 200MB
};

// Function to calculate optimal chunk size based on file size
// Best practices: 10MB for 100MB-1GB, 25MB for 1GB-5GB, 100MB for >5GB
function getOptimalChunkSize(fileSize) {
    const ONE_GB = 1024 * 1024 * 1024; // 1GB
    const FIVE_GB = 5 * 1024 * 1024 * 1024; // 5GB

    if (fileSize < ONE_GB) {
        // 100MB - 1GB: Use 10MB chunks (optimal for most videos)
        return 10 * 1024 * 1024; // 10MB
    } else if (fileSize < FIVE_GB) {
        // 1GB - 5GB: Use 25MB chunks
        return 25 * 1024 * 1024; // 25MB
    } else {
        // > 5GB: Use 100MB chunks
        return 100 * 1024 * 1024; // 100MB
    }
}

// Threshold for using multipart upload (files larger than this use multipart)
const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { fileName, fileSize, fileType, category } = body;

        // Validate required fields
        if (!fileName || !fileSize || !fileType || !category) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: fileName, fileSize, fileType, category' },
                { status: 400 }
            );
        }

        // Validate category
        const validCategories = ['videos', 'images', 'articles', 'sounds'];
        if (!validCategories.includes(category)) {
            return NextResponse.json(
                { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate file size
        const maxSize = FILE_SIZE_LIMITS[category];
        if (!maxSize) {
            return NextResponse.json(
                { success: false, error: 'Invalid category' },
                { status: 400 }
            );
        }

        if (fileSize > maxSize) {
            const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
            return NextResponse.json(
                { success: false, error: `File too large. Maximum size for ${category} is ${maxSizeMB}MB` },
                { status: 400 }
            );
        }

        // Configure CORS if not already configured (one-time setup)
        if (!corsConfigured) {
            try {
                await configureCORS();
                corsConfigured = true;
                console.log('✅ CORS configured automatically');
            } catch (corsError) {
                console.warn('⚠️ Could not auto-configure CORS. Please configure manually in DigitalOcean dashboard:', corsError.message);
                // Continue anyway - user might have configured it manually
            }
        }

        // Generate unique filename
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `library/${category}/${uniqueFileName}`;

        // Determine if we should use multipart upload
        const useMultipart = fileSize > MULTIPART_THRESHOLD;

        if (useMultipart) {
            // Initiate multipart upload
            const uploadId = await createMultipartUpload(filePath, fileType);

            // Calculate optimal chunk size based on file size
            const chunkSize = getOptimalChunkSize(fileSize);

            // Calculate number of chunks
            const totalChunks = Math.ceil(fileSize / chunkSize);

            console.log(`📦 Multipart upload initiated: fileSize=${(fileSize / 1024 / 1024).toFixed(2)}MB, chunkSize=${(chunkSize / 1024 / 1024).toFixed(2)}MB, totalChunks=${totalChunks}`);

            return NextResponse.json({
                success: true,
                uploadType: 'multipart',
                uploadId,
                filePath,
                fileName: uniqueFileName,
                publicUrl: getCdnUrl(filePath),
                chunkSize: chunkSize, // Dynamic chunk size based on file size
                totalChunks,
                expiresIn: 3600, // 1 hour
            });
        } else {
            // Use single PUT upload for smaller files
            const presignedUrl = await generatePresignedUrl(filePath, fileType, fileSize, 3600);

            return NextResponse.json({
                success: true,
                uploadType: 'single',
                presignedUrl,
                filePath,
                fileName: uniqueFileName,
                publicUrl: getCdnUrl(filePath),
                expiresIn: 3600, // 1 hour
            });
        }
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate upload URL',
                details: error.message
            },
            { status: 500 }
        );
    }
}

