'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { saveAudioChunk } from '@/lib/storage/indexed-db';
import { uploadAudioChunk } from '@/lib/storage/upload';


interface UseAudioRecorderProps {
    meetingId: string;
    onStop?: (blob: Blob) => void;
}

export function useAudioRecorder({ meetingId, onStop }: UseAudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0); // 0-100
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const chunkIndexRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Audio Context (for visualizer)
    const audioContextRef = useRef<AudioContext | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Initialize Audio Context & Analyser
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            // Visualize loop
            const updateAudioLevel = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(average); // 0-255 roughly
                animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
            };
            updateAudioLevel();

            // MediaRecorder Setup
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            chunkIndexRef.current = 0;

            mediaRecorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                    // Save chunk to IndexedDB immediately for offline safety
                    await saveAudioChunk(meetingId, e.data);

                    // Try Upload (if Online)
                    if (navigator.onLine) {
                        uploadAudioChunk(meetingId, e.data, chunkIndexRef.current)
                            .catch(err => console.error('Background upload failed:', err));
                    }
                    chunkIndexRef.current++;
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                if (onStop) onStop(blob);
                stopTimer();
                stopVisualizer();
            };

            // Start recording with 1s timeslice to get frequent chunks
            mediaRecorder.start(1000);
            setIsRecording(true);
            setIsPaused(false);
            startTimer();
            setError(null);

        } catch (err: any) {
            console.error('Error accessing microphone:', err);
            setError('Microphone access denied or not available.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            stopTimer();
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimer();
        }
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const stopVisualizer = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
        }
        setAudioLevel(0);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            stopTimer();
            stopVisualizer();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return {
        isRecording,
        isPaused,
        duration,
        audioLevel,
        error,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording
    };
}
