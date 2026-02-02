import { createClient } from '@/lib/supabase/server';
import { TranscriptViewer } from '@/components/transcript/TranscriptViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Metadata } from 'next';

// Generate dynamic metadata for sharing (OpenGraph)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data: meeting } = await supabase.from('meetings').select('title').eq('id', id).single();

    return {
        title: meeting?.title || 'Shared Meeting - Virtual Secretary',
        description: 'View transcript and summary of this meeting',
    };
}

export default async function SharedMeetingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch meeting data (assuming RLS allows public read if token present, or if we toggle 'public' flag)
    // For MVP, enable READ for 'public' role on specific columns or check for a shared token?
    // Or just check if user is authenticated?
    // Requirement 4.3: WhatsApp/Telegram share links. Usually public deep link.

    // Warning: Access Control.
    // Standard Pattern: table `meeting_shares` with token. OR `meetings.is_public` boolean.
    // Let's check schema. No boolean.
    // Strategy: Add `is_public` to query. If RLS blocks, we return 404.
    // To allow public access, we need RLS policy: "Allow select if is_public = true".
    // Or we use a Service Role client here (Server Component) to fetch data regardless of RLS, 
    // BUT we must verify if the meeting is inteded to be shared.
    // Let's assume for now the user MUST be logged in to view (Deep link opens app).
    // AND/OR we add a simple check.

    // Real world: Use signed URL or public flag.
    // For MVP: Fetch as admin (createClient role service_role?) or assuming user logs in.
    // If we want EXTERNAL sharing (no login), we need `is_public`.

    // Let's fetch as normal user (createClient). If fails, show Login.
    const { data: meeting, error } = await supabase
        .from('meetings')
        .select(`
        *,
        transcripts (*),
        analysis (*)
    `)
        .eq('id', id)
        .single();

    if (error || !meeting) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <h1 className="text-xl font-bold mb-2">Access Denied or Not Found</h1>
                        <p className="text-zinc-500 mb-4">You may need to log in to view this meeting.</p>
                        <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">Login</a>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl p-4 py-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">{meeting.title}</h1>
                <p className="text-zinc-500">{new Date(meeting.date).toLocaleDateString()}</p>
            </header>

            {/* Pass initial data to client viewer */}
            <TranscriptViewer meetingId={id} initialData={meeting} />

            <footer className="mt-12 text-center text-zinc-600 text-sm">
                Powered by Virtual Secretary
            </footer>
        </div>
    );
}
