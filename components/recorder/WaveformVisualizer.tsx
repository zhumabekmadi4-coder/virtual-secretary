'use client';

import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
    isRecording: boolean;
    audioLevel: number; // 0-255
}

export function WaveformVisualizer({ isRecording, audioLevel }: WaveformVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Smooth out the level for better visuals
    const smoothLevelRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const draw = () => {
            if (!isRecording) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Draw idle line
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.strokeStyle = '#4B5563'; // gray-600
                ctx.lineWidth = 2;
                ctx.stroke();
                return;
            }

            // Smooth level transition
            smoothLevelRef.current += (audioLevel - smoothLevelRef.current) * 0.2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;

            ctx.beginPath();
            ctx.moveTo(0, centerY);

            // Create a dynamic wave based on audio level
            const amplitude = (smoothLevelRef.current / 255) * (height / 2);
            const frequency = 0.1;
            const speed = Date.now() * 0.005;

            for (let x = 0; x < width; x++) {
                const y = centerY + Math.sin(x * frequency + speed) * amplitude * Math.sin(x / width * Math.PI); // Window function for clean edges
                ctx.lineTo(x, y);
            }

            // Gradient stroke
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, '#3B82F6'); // blue-500
            gradient.addColorStop(0.5, '#A855F7'); // purple-500 (allowed accent)
            gradient.addColorStop(1, '#EC4899'); // pink-500

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.stroke();

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [isRecording, audioLevel]);

    return (
        <div className="w-full h-24 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
            <canvas
                ref={canvasRef}
                width={300}
                height={100}
                className="w-full h-full"
            />
        </div>
    );
}
