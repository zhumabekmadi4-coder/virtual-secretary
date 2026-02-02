'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TranscriptViewer } from '@/components/transcript/TranscriptViewer';
import { Loader2, ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function MeetingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const [meeting, setMeeting] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [meetingId, setMeetingId] = useState<string>('');

    useEffect(() => {
        params.then(p => setMeetingId(p.id));
    }, [params]);

    useEffect(() => {
        if (!meetingId) return;

        const fetchMeeting = async () => {
            const supabase = createClient();

            const { data, error } = await supabase
                .from('meetings')
                .select(`
          *,
          transcripts (*),
          analysis (*)
        `)
                .eq('id', meetingId)
                .single();

            if (error) console.error('Error fetching meeting:', error);
            else setMeeting(data);

            setLoading(false);
        };

        fetchMeeting();
    }, [meetingId]);

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!meeting) {
        return <div className="p-8 text-center">Встреча не найдена</div>;
    }

    return (
        <div className="flex flex-col space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">{meeting.title || 'Встреча'}</h1>
                        <div className="flex items-center text-sm text-zinc-400 space-x-3">
                            <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(meeting.date).toLocaleDateString()}</span>
                            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {Math.floor(meeting.duration / 60)} мин</span>
                        </div>
                    </div>
                </div>

                <Button variant="outline" size="sm" onClick={() => {
                    const url = `${window.location.origin}/share/${meetingId}`;
                    navigator.clipboard.writeText(url);
                    alert('Ссылка скопирована!');
                }}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Поделиться
                </Button>
            </div>

            {/* Transcript & Analysis */}
            <TranscriptViewer meetingId={meetingId} initialData={meeting} />

        </div>
    );
}
