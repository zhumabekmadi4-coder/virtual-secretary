'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Calendar, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function MeetingsListPage() {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchMeetings = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('meetings')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setMeetings(data);
            setLoading(false);
        };

        fetchMeetings();
    }, []);

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Встречи</h1>
                <Button onClick={() => router.push('/record')} size="sm" className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Новая
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : meetings.length === 0 ? (
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                        <p className="text-zinc-500">Нет записанных встреч</p>
                        <Button onClick={() => router.push('/record')} variant="outline">Начать запись</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {meetings.map((meeting) => (
                        <Card
                            key={meeting.id}
                            className="bg-zinc-900/50 border-zinc-800 active:scale-98 transition-transform cursor-pointer"
                            onClick={() => router.push(`/dashboard/meetings/${meeting.id}`)}
                        >
                            <div className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-zinc-100">{meeting.title || 'Новая встреча'}</h3>
                                    <div className="flex items-center text-xs text-zinc-500 mt-1 space-x-2">
                                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(meeting.date).toLocaleDateString()}</span>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${meeting.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                meeting.status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-zinc-500/10 text-zinc-500'
                                            }`}>
                                            {meeting.status}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-zinc-600" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
