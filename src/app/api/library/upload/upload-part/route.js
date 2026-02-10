import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption";
import { generatePartPresignedUrl } from "@/app/lib/s3Client";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const filePath = formData.get('filePath');
        const uploadId = formData.get('uploadId');
        const partNumber = parseInt(formData.get('partNumber'));
        const chunk = formData.get('chunk');

        console.log(`📤 Upload part request: partNumber=${partNumber}, filePath=${filePath}, uploadId=${uploadId}, chunkSize=${chunk?.size || 'unknown'}`);

        // Validate required fields
        if (!filePath || !uploadId || !partNumber || !chunk) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: filePath, uploadId, partNumber, chunk' },
                { status: 400 }
            );
        }

        if (partNumber < 1 || partNumber > 10000) {
            return NextResponse.json(
                { success: false, error: 'Part number must be between 1 and 10000' },
                { status: 400 }
            );
        }

        // Generate presigned URL for this part
        console.log(`🔗 Generating presigned URL for part ${partNumber}...`);
        const presignedUrl = await generatePartPresignedUrl(filePath, uploadId, partNumber, 3600);
        console.log(`✅ Presigned URL generated for part ${partNumber}`);

        // Convert chunk to ArrayBuffer for upload
        const chunkBuffer = await chunk.arrayBuffer();
        console.log(`📦 Uploading chunk ${partNumber} to S3 (${chunkBuffer.byteLength} bytes)...`);

        // Upload chunk to S3 server-side (server can read ETag header)
        const uploadResponse = await fetch(presignedUrl, {
            method: 'PUT',
            body: chunkBuffer,
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error(`S3 upload failed for part ${partNumber}:`, uploadResponse.status, errorText);
            throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        // Get ETag from response (server can read it, browser cannot due to CORS)
        const etag = uploadResponse.headers.get('ETag') || uploadResponse.headers.get('etag');

        if (!etag) {
            // Log all available headers for debugging
            console.error(`❌ Missing ETag for part ${partNumber}. Available headers:`,
                Array.from(uploadResponse.headers.entries()));
            throw new Error(`Missing ETag in S3 response for part ${partNumber}`);
        }

        console.log(`✅ Part ${partNumber} uploaded successfully, ETag: ${etag}`);

        return NextResponse.json({
            success: true,
            partNumber,
            etag: etag.replace(/"/g, ''), // Remove quotes from ETag
        });
    } catch (error) {
        console.error('Error uploading part:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to upload part',
                details: error.message
            },
            { status: 500 }
        );
    }
}
