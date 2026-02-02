'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Pause, Play, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { WaveformVisualizer } from '@/components/recorder/WaveformVisualizer';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';

// Force dynamic rendering to avoid static generation issues with browser APIs
export const dynamic = 'force-dynamic';

export default function RecordPage() {
    const router = useRouter();
    const [meetingId, setMeetingId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Subscription Check
    const { isLimitReached, loading: subLoading } = useSubscription();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Initialize meeting ID on mount
    useEffect(() => {
        setMeetingId(crypto.randomUUID());
    }, []);

    const handleStop = async (blob: Blob) => {
        setIsSaving(true);
        console.log('Recording stopped, blob size:', blob.size);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { error } = await supabase
                    .from('meetings')
                    .insert({
                        id: meetingId, // Use the ID we generated
                        user_id: user.id,
                        title: `Встреча ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                        date: new Date().toISOString(),
                        duration: duration,
                        status: 'uploaded'
                    });

                if (error) {
                    console.error('Error creating meeting:', error);
                    // Fallback or alert? For now log.
                }
            }
        } catch (e) {
            console.error('Failed to save meeting record:', e);
        }

        // Simulate processing delay (or wait for upload confirmation if we had it)
        setTimeout(() => {
            setIsSaving(false);
            router.push(`/dashboard/meetings/${meetingId}`);
        }, 1500);
    };

    const {
        isRecording,
        isPaused,
        duration,
        audioLevel,
        error,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording
    } = useAudioRecorder({
        meetingId,
        onStop: handleStop
    });

    const handleStart = async () => {
        if (isLimitReached) {
            setShowUpgradeModal(true);
            return;
        }
        await startRecording();
    };

    // Wake Lock
    const { isSupported, request, release } = useWakeLock();
    useEffect(() => {
        if (isRecording && !isPaused && isSupported) {
            request();
        } else {
            release();
        }
    }, [isRecording, isPaused, isSupported, request, release]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    if (subLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>;

    return (
        <div className="flex flex-col h-full p-4 space-y-6 max-w-md mx-auto">
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Новая запись</h1>
                <div className="flex items-center space-x-2">
                    {isRecording && (
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                    <span className="text-zinc-400 font-mono">{formatTime(duration)}</span>
                </div>
            </header>

            {error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <Card className="flex-1 bg-zinc-900/50 border-zinc-800 p-6 flex flex-col justify-center items-center space-y-8">

                {/* Visualizer */}
                <div className="w-full">
                    <WaveformVisualizer isRecording={isRecording && !isPaused} audioLevel={audioLevel} />
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center space-x-6">
                    {!isRecording ? (
                        <Button
                            size="lg"
                            className={`h-24 w-24 rounded-full shadow-lg transition-all hover:scale-105 ${isLimitReached
                                ? 'bg-zinc-700 hover:bg-zinc-700 opacity-50 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
                                }`}
                            onClick={handleStart}
                        >
                            <Mic className="h-10 w-10 text-white" />
                        </Button>
                    ) : (
                        <>
                            {isPaused ? (
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-14 w-14 rounded-full border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                                    onClick={() => resumeRecording()}
                                >
                                    <Play className="h-6 w-6 text-green-500" />
                                </Button>
                            ) : (
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-14 w-14 rounded-full border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                                    onClick={() => pauseRecording()}
                                >
                                    <Pause className="h-6 w-6 text-yellow-500" />
                                </Button>
                            )}

                            <Button
                                size="lg"
                                className="h-20 w-20 rounded-full bg-zinc-100 hover:bg-white text-zinc-900 shadow-lg transition-all hover:scale-105"
                                onClick={() => stopRecording()}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-8 w-8 animate-spin" /> : <Square className="h-8 w-8 fill-current" />}
                            </Button>
                        </>
                    )}
                </div>

                <p className="text-zinc-500 text-sm text-center">
                    {!isRecording
                        ? (isLimitReached ? "Лимит встреч исчерпан" : "Нажмите микрофон, чтобы начать")
                        : isPaused
                            ? "Запись на паузе"
                            : "Идет запись..."}
                </p>

                {isLimitReached && !isRecording && (
                    <Button variant="link" className="text-yellow-500" onClick={() => setShowUpgradeModal(true)}>
                        Upgrade to Pro
                    </Button>
                )}
            </Card>

            {/* DEBUG INFO */}
            <div className="bg-black text-xs font-mono text-zinc-600 p-2 rounded border border-zinc-800">
                <p>M_ID: {meetingId.slice(0, 8)}...</p>
                <p>PF: {isSupported ? 'Yes' : 'No'}</p>
                {/* @ts-ignore */}
                <p>SUB: {subLoading ? '...' : `${JSON.stringify({ isLimitReached })}`}</p>
            </div>
        </div>
    );
}
