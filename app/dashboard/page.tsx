'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, List, Clock, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';

export default function DashboardPage() {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    const { isLimitReached, usage, limit, tier } = useSubscription();

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'User');

                // Fetch simple meeting stats or list
                const { data, error } = await supabase
                    .from('meetings')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (!error) setMeetings(data || []);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zinc-500" /></div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold">Привет, {userName} 👋</h1>
                <p className="text-zinc-400">Готов к работе?</p>
            </header>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/record">
                    <Card className="bg-red-600 border-red-500 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer h-full shadow-lg hover:shadow-red-900/20">
                        <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                            <Mic className="h-8 w-8" />
                            <span className="font-bold">Записать</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/meetings">
                    <Card className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer h-full shadow-lg">
                        <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                            <List className="h-8 w-8" />
                            <span className="font-bold">Все встречи</span>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Stats / Subscription */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-zinc-400">Ваш план: {tier === 'pro' ? 'Pro 🚀' : 'Free'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Использовано встреч</span>
                            <span>{usage} / {limit === Infinity ? '∞' : limit}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${isLimitReached ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${limit === Infinity ? 0 : (usage / limit) * 100}%` }}
                            />
                        </div>
                        {isLimitReached && (
                            <p className="text-xs text-red-400 mt-2">Лимит исчерпан. Обновите план для записи новых встреч.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Meetings */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Недавние</h2>
                    <Link href="/dashboard/meetings" className="text-sm text-blue-400 flex items-center">
                        Все <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                </div>

                {meetings.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed">
                        Нет записей
                    </div>
                ) : (
                    <div className="space-y-3">
                        {meetings.map(meeting => (
                            <Link key={meeting.id} href={`/dashboard/meetings/${meeting.id}`}>
                                <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer group">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{meeting.title}</h3>
                                            <div className="flex items-center text-xs text-zinc-500 mt-1 space-x-3">
                                                <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {Math.floor(meeting.duration / 60)} мин</span>
                                                <span>{new Date(meeting.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {meeting.status === 'processed' && <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* DEBUG INFO */}
            <div className="bg-zinc-950 text-xs font-mono text-zinc-600 p-2 rounded border border-zinc-800 mt-8">
                <p>PLAN_DEBUG: {tier} / {limit}</p>
                <p>USAGE: {usage}</p>
                <p>LIMIT_REACHED: {isLimitReached ? 'YES' : 'NO'}</p>
            </div>
        </div >
    );
}
