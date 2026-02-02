import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as Blob;
        const meetingId = formData.get('meetingId') as string;
        const chunkId = formData.get('chunkId') as string;

        if (!file || !meetingId) {
            return NextResponse.json({ error: 'Missing file or meetingId' }, { status: 400 });
        }

        const supabase = await createClient();
        const filePath = `${meetingId}/${chunkId || Date.now()}.webm`;

        const { data, error } = await supabase.storage
            .from('recordings') // Ensure this bucket exists in Supabase
            .upload(filePath, file, {
                contentType: 'audio/webm',
                upsert: true
            });

        if (error) {
            console.error('Storage upload error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, path: data.path });

    } catch (error: any) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
