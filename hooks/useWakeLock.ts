'use client';

import { useEffect, useState, useCallback } from 'react';

export function useWakeLock() {
    const [isSupported, setIsSupported] = useState(false);
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

    useEffect(() => {
        setIsSupported('wakeLock' in navigator);
    }, []);

    const request = useCallback(async () => {
        if (!isSupported) return;
        try {
            const lock = await navigator.wakeLock.request('screen');
            setWakeLock(lock);

            lock.addEventListener('release', () => {
                setWakeLock(null);
            });
        } catch (err) {
            console.error('Wake Lock request failed:', err);
        }
    }, [isSupported]);

    const release = useCallback(async () => {
        if (wakeLock) {
            await wakeLock.release();
            setWakeLock(null);
        }
    }, [wakeLock]);

    return { isSupported, request, release };
}
