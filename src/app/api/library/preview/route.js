import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption";
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

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

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('path');

        if (!filePath) {
            return NextResponse.json({ message: "File path is required" }, { status: 400 });
        }

        // Extract the key from the full URL
        let key;
        console.log('Original filePath:', filePath);

        if (filePath.includes('library/') && !filePath.startsWith('http')) {
            // If it's already a key path (starts with library/) and not a full URL
            key = filePath;
        } else {
            // If it's a full URL, extract the key after the bucket name
            try {
                const url = new URL(filePath);
                console.log('Parsed URL:', {
                    hostname: url.hostname,
                    pathname: url.pathname
                });

                // Remove leading slash and split path
                const pathParts = url.pathname.substring(1).split('/').filter(part => part);
                console.log('Path parts:', pathParts);

                // The key should be everything after the bucket name
                // For DigitalOcean Spaces URLs like: /library/images/filename.jpg
                // The key should be: library/images/filename.jpg
                key = pathParts.join('/');

            } catch (error) {
                console.error('URL parsing error:', error);
                return NextResponse.json({ message: "Invalid URL format" }, { status: 400 });
            }
        }

        console.log('Final extracted key:', key);

        console.log('Preview request for key:', key);

        // Get the file from DigitalOcean Spaces
        const command = new GetObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: key,
        });

        console.log('S3 command:', {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: key
        });

        let response;
        try {
            response = await s3Client.send(command);
            console.log('S3 response received, ContentType:', response.ContentType);
        } catch (error) {
            console.error('First attempt failed:', error.message);

            // Try alternative path variations
            const alternativeKeys = [
                key.replace('library/', ''), // Remove library prefix
                key.split('/').slice(1).join('/'), // Remove first part
                key.split('/').pop() // Just the filename
            ];

            console.log('Trying alternative keys:', alternativeKeys);

            for (const altKey of alternativeKeys) {
                if (altKey && altKey !== key) {
                    try {
                        console.log(`Trying alternative key: ${altKey}`);
                        const altCommand = new GetObjectCommand({
                            Bucket: process.env.DO_SPACES_BUCKET,
                            Key: altKey,
                        });
                        response = await s3Client.send(altCommand);
                        console.log(`Success with alternative key: ${altKey}`);
                        break;
                    } catch (altError) {
                        console.log(`Alternative key ${altKey} also failed:`, altError.message);
                    }
                }
            }

            if (!response) {
                throw error; // Re-throw original error if all attempts failed
            }
        }

        // Convert the stream to buffer
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Set appropriate headers
        const headers = new Headers();
        headers.set('Content-Type', response.ContentType || 'application/octet-stream');
        headers.set('Content-Length', buffer.length.toString());
        headers.set('Cache-Control', 'public, max-age=3600');

        return new NextResponse(buffer, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Preview error:', error);
        return NextResponse.json({
            message: "Failed to preview file",
            error: error.message
        }, { status: 500 });
    }
}
