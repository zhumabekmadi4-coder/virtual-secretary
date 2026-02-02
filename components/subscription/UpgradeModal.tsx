'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        Upgrade to Pro
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Вы достигли лимита бесплатных встреч. Перейдите на Pro для безлимитной записи.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-950/50">
                        <div>
                            <h3 className="font-bold text-white">Free Plan</h3>
                            <p className="text-sm text-zinc-500">1 Встреча / месяц</p>
                        </div>
                        <p className="font-mono text-zinc-500">$0</p>
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-yellow-500/50 rounded-lg bg-yellow-500/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl">RECOMMENDED</div>
                        <div>
                            <h3 className="font-bold text-white">Pro Plan</h3>
                            <p className="text-sm text-yellow-500/80">Безлимит встреч + AI</p>
                        </div>
                        <p className="font-mono text-xl font-bold text-white">$9.99<span className="text-xs font-normal text-zinc-500">/mo</span></p>
                    </div>

                    <ul className="space-y-2 text-sm text-zinc-300">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Неограниченное количество записей</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Полная транскрибация (Whisper)</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> AI Анализ и Итоги (GPT-4o)</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Экспорт в PDF</li>
                    </ul>
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button type="button" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold" onClick={() => alert('Stripe Integration Coming Soon!')}>
                        Get Pro Access
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
