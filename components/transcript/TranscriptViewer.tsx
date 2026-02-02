'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, PlayCircle, CheckCircle2, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeetingData {
    id: string;
    status: string;
    transcripts?: {
        content?: string;
        full_text?: string;
    }[];
    analysis?: {
        summary: string;
        agenda: string[];
        tasks: any[];
        decisions: string[];
        sentiment?: string;
    }[];
}

export function TranscriptViewer({ meetingId, initialData }: { meetingId: string, initialData: MeetingData }) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Use data from props or potentially fetch fresh data if needed via SWR/React Query in future
    // For now we just use initialData and reload on process
    const data = initialData;

    const handleProcess = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/process-meeting', {
                method: 'POST',
                body: JSON.stringify({ meetingId }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Processing failed with status ${res.status}`);
            }

            // Reload page to show new data
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            alert(`Ошибка обработки: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const hasTranscript = (data.transcripts && data.transcripts.length > 0) || (data.analysis && data.analysis.length > 0);
    const analysis = data.analysis?.[0];
    const transcriptText = data.transcripts?.[0]?.full_text || data.transcripts?.[0]?.content;

    // Empty state / Processing needed
    if (!hasTranscript && data.status !== 'completed') {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <div className="glass rounded-2xl p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-blue-500/30">
                        <Sparkles className="w-8 h-8 text-blue-400" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">Готовы к магии?</h3>
                        <p className="text-zinc-400 text-sm">
                            Аудио загружено. Нажмите кнопку, чтобы получить стенограмму и умный анализ встречи.
                        </p>
                    </div>

                    <Button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        size="lg"
                        className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Анализирую...
                            </>
                        ) : (
                            <>
                                <PlayCircle className="mr-2 h-5 w-5" />
                                Начать AI Обработку
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Tabs defaultValue="summary" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-zinc-900/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
                        <TabsTrigger
                            value="summary"
                            className="rounded-full px-6 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white hover:bg-zinc-800/50 hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-violet-400" />
                            AI Итоги
                        </TabsTrigger>
                        <TabsTrigger
                            value="transcript"
                            className="rounded-full px-6 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white hover:bg-zinc-800/50 hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <FileText className="w-4 h-4 mr-2 text-blue-400" />
                            Стенограмма
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="summary" className="space-y-6">
                    {analysis ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Summary Card */}
                            <div className="glass rounded-xl p-6 md:col-span-2 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <h3 className="text-lg font-medium text-violet-200 mb-4 flex items-center">
                                    <Sparkles className="w-4 h-4 mr-2 opacity-70" />
                                    Краткое содержание
                                </h3>
                                <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
                                    {analysis.summary}
                                </p>
                            </div>

                            {/* Decisions Card */}
                            <div className="glass rounded-xl p-6 col-span-1 border-l-4 border-l-emerald-500/50">
                                <h3 className="text-lg font-medium text-emerald-200 mb-4">Принятые решения</h3>
                                <ul className="space-y-3">
                                    {analysis.decisions?.length > 0 ? (
                                        analysis.decisions.map((d: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span>{d}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-zinc-500 text-sm italic">Решений не найдено</p>
                                    )}
                                </ul>
                            </div>

                            {/* Tasks Card */}
                            <div className="glass rounded-xl p-6 col-span-1 border-l-4 border-l-blue-500/50">
                                <h3 className="text-lg font-medium text-blue-200 mb-4">Задачи</h3>
                                <div className="space-y-3">
                                    {analysis.tasks?.length > 0 ? (
                                        analysis.tasks.map((t: any, i: number) => (
                                            <div key={i} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                                                        {t.assignee || 'General'}
                                                    </span>
                                                    {t.deadline && (
                                                        <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">
                                                            {t.deadline}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-zinc-200">{t.task}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-zinc-500 text-sm italic">Задач не найдено</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass p-12 text-center rounded-xl">
                            <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-400">AI анализ недоступен для этой встречи.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="transcript">
                    <div className="glass rounded-xl p-6 md:p-10 relative group">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white"
                            onClick={() => {
                                navigator.clipboard.writeText(transcriptText || "");
                                alert("Текст скопирован!");
                            }}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Копировать
                        </Button>
                        <div className="prose prose-invert prose-lg max-w-none">
                            {transcriptText ? (
                                <div className="whitespace-pre-wrap font-sans text-base md:text-lg leading-loose text-zinc-200 tracking-wide">
                                    {transcriptText}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-zinc-500 italic">
                                    Текст отсутствует...
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
