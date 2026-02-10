import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption";
import { completeMultipartUpload, abortMultipartUpload, getCdnUrl, setFilePublic, listUploadedParts } from "@/app/lib/s3Client";
import { userRepo } from "@/app/lib/db/userRepo";
import { saveVideo, saveImage, savePDF, saveSound } from "@/app/lib/db/resourceRepo.js";

// Map categories to save functions
const SAVE_FUNCTIONS = {
    videos: saveVideo,
    images: saveImage,
    articles: savePDF,
    sounds: saveSound,
};

// Map categories to resource types
const RESOURCE_TYPES = {
    videos: 'video',
    images: 'image',
    articles: 'article',
    sounds: 'sound',
};

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { filePath, fileName, uploadId, parts, title, description, author, category, fileSize, fileType, folderId } = body;

        // Validate required fields
        if (!filePath || !fileName || !uploadId || !parts || !title || !description || !category) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: filePath, fileName, uploadId, parts, title, description, category' },
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

        // Validate parts array
        if (!Array.isArray(parts) || parts.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Parts must be a non-empty array' },
                { status: 400 }
            );
        }

        // Format parts for S3 (must have PartNumber and ETag)
        // If any parts are missing ETags (due to CORS), list them from S3
        let formattedParts = parts.map(part => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
        }));

        // Check if any parts are missing ETags (null or undefined)
        const missingEtags = formattedParts.filter(part => !part.ETag);
        if (missingEtags.length > 0) {
            console.log(`⚠️ ${missingEtags.length} parts missing ETags, listing from DigitalOcean Spaces...`);
            // List all uploaded parts from S3 to get ETags
            const uploadedParts = await listUploadedParts(filePath, uploadId);
            
            // Create a map of part numbers to ETags
            const etagMap = new Map();
            uploadedParts.forEach(part => {
                etagMap.set(part.PartNumber, part.ETag);
            });

            // Fill in missing ETags
            formattedParts = formattedParts.map(part => {
                if (!part.ETag && etagMap.has(part.PartNumber)) {
                    return {
                        PartNumber: part.PartNumber,
                        ETag: etagMap.get(part.PartNumber),
                    };
                }
                return part;
            });

            // Verify all parts now have ETags
            const stillMissing = formattedParts.filter(part => !part.ETag);
            if (stillMissing.length > 0) {
                throw new Error(`Missing ETags for parts: ${stillMissing.map(p => p.PartNumber).join(', ')}`);
            }
        }

        // Complete multipart upload
        let completeResult;
        try {
            completeResult = await completeMultipartUpload(filePath, uploadId, formattedParts);
        } catch (error) {
            console.error('Error completing multipart upload:', error);
            // Try to abort the upload to clean up
            await abortMultipartUpload(filePath, uploadId);
            throw error;
        }

        // Ensure file is publicly readable
        await setFilePublic(filePath);

        // Get user
        const email = session.user.email;
        const user = await userRepo.getUserByEmail(email);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Generate public URL
        const publicUrl = getCdnUrl(filePath);

        // Get the appropriate save function
        const saveFunction = SAVE_FUNCTIONS[category];
        const resourceType = RESOURCE_TYPES[category];

        if (!saveFunction) {
            return NextResponse.json(
                { success: false, error: 'Invalid category' },
                { status: 400 }
            );
        }

        // Save to database
        let resource;
        if (category === 'articles') {
            resource = await saveFunction(
                title,
                user.id,
                resourceType,
                publicUrl,
                description,
                author || '',
                fileSize || null,
                fileType || null,
                folderId || null
            );
        } else {
            resource = await saveFunction(
                title,
                user.id,
                resourceType,
                publicUrl,
                description,
                '',
                fileSize || null,
                fileType || null,
                folderId || null
            );
        }

        return NextResponse.json({
            success: true,
            status: true,
            message: `${category.charAt(0).toUpperCase() + category.slice(1)} uploaded successfully`,
            data: {
                url: publicUrl,
                filename: fileName,
                [category.slice(0, -1)]: resource // video, image, article, sound
            }
        });
    } catch (error) {
        console.error('Error completing multipart upload:', error);
        return NextResponse.json(
            {
                success: false,
                status: false,
                message: 'Failed to complete upload',
                error: error.message
            },
            { status: 500 }
        );
    }
}

