import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'audio');
        await mkdir(uploadsDir, { recursive: true });

        // Save file
        const filePath = join(uploadsDir, fileName);
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Return the public URL
        const audioUrl = `/uploads/audio/${fileName}`;

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
