import { createClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/ai/whisper';
import { analyzeTranscript } from '@/lib/ai/analyzer';
import { refineTranscript } from '@/lib/ai/refiner';
import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
    try {
        const { meetingId } = await request.json();

        if (!meetingId) {
            return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Get Meeting Info
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', meetingId)
            .single();

        if (meetingError || !meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // 2. List Chunks from Storage
        const { data: files, error: listError } = await supabase.storage
            .from('recordings')
            .list(meetingId, {
                sortBy: { column: 'name', order: 'asc' }
            });

        if (listError || !files || files.length === 0) {
            return NextResponse.json({ error: 'No recordings found' }, { status: 404 });
        }

        // 3. Download & Concat Chunks
        const buffers: Buffer[] = [];
        for (const file of files) {
            const { data: blob, error: downloadError } = await supabase.storage
                .from('recordings')
                .download(`${meetingId}/${file.name}`);

            if (downloadError || !blob) continue;
            const arrayBuffer = await blob.arrayBuffer();
            buffers.push(Buffer.from(arrayBuffer));
        }

        if (buffers.length === 0) {
            return NextResponse.json({ error: 'Failed to download chunks' }, { status: 500 });
        }

        const fullAudioBuffer = Buffer.concat(buffers);
        const file = new File([fullAudioBuffer], `meeting-${meetingId}.webm`, { type: 'audio/webm' });

        // 4. Transcribe
        let transcriptText;
        try {
            // Debug: Check if file has size
            console.log(`Transcribing file size: ${file.size} type: ${file.type}`);
            const transcriptResponse = await transcribeAudio(file);
            transcriptText = transcriptResponse.text;
        } catch (e: any) {
            console.error('Transcription failed:', e);
            return NextResponse.json({ error: `Transcription failed: ${e.message}`, details: e }, { status: 500 });
        }

        // 4. Refine Transcript (Cleanup) -> NEW STEP
        let refinedText;
        try {
            refinedText = await refineTranscript(transcriptText);
        } catch (e: any) {
            console.error('Refinement failed:', e);
            return NextResponse.json({ error: `Refinement failed: ${e.message}` }, { status: 500 });
        }

        // 5. AI Analysis (GPT-4) - use refined text for better results
        let analysis;
        try {
            analysis = await analyzeTranscript(refinedText);
        } catch (e: any) {
            console.error('Analysis failed:', e);
            return NextResponse.json({ error: `Analysis failed: ${e.message}` }, { status: 500 });
        }

        // 6. Save to Database

        // 6.1 Save Transcript (Correct Schema: full_text)
        const { error: transcriptDbError } = await supabase
            .from('transcripts')
            .insert({
                meeting_id: meetingId,
                full_text: refinedText // Save the polished version
            });

        if (transcriptDbError) console.error('Transcript save error:', transcriptDbError);

        // 6.2 Save Analysis (Correct Schema: key_points, tasks jsonb, summary, sentiment)
        // Note: 'agenda' from AI maps to 'key_points' in DB for now, or we store it in summary. 
        // Schema has: summary text, key_points text[], tasks jsonb, sentiment text. 
        // AI returns: summary, agenda, tasks, decisions, sentiment.

        const { error: analysisDbError } = await supabase.from('analysis').insert({
            meeting_id: meetingId,
            summary: analysis.summary,
            tasks: analysis.tasks,
            key_points: analysis.agenda, // Mapping Agenda -> Key Points
            decisions: analysis.decisions, // Added missing decisions
            sentiment: analysis.sentiment
        });

        if (analysisDbError) console.error('Analysis save error:', analysisDbError);

        // 6.3 Update Meeting Status
        await supabase.from('meetings').update({
            status: 'completed'
        }).eq('id', meetingId);

        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        console.error('Processing error:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack,
            stage: 'unknown' // The error might have happened before consistent logging
        }, { status: 500 });
    }
}
