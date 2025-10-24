import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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
        let fileExtension = 'webm'; // Default
        if (audioFile.type) {
            const typeParts = audioFile.type.split('/');
            if (typeParts.length > 1) {
                fileExtension = typeParts[1].split(';')[0];
            }
        }

        const fileName = `${uuidv4()}.${fileExtension}`;
        console.log('📝 Processing voice message:', { fileName, type: audioFile.type, size: audioFile.size });

        // Convert file to buffer
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to local storage (public/uploads/audio)
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'audio');
        await mkdir(uploadsDir, { recursive: true });

        const localFilePath = join(uploadsDir, fileName);
        await writeFile(localFilePath, buffer);

        const audioUrl = `/uploads/audio/${fileName}`;
        console.log('✅ Voice message saved:', audioUrl);

        return NextResponse.json({
            success: true,
            audioUrl,
            fileName,
            fileSize: buffer.length,
            fileType: audioFile.type
        });

    } catch (error) {
        console.error('❌ Error processing audio:', error);
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
