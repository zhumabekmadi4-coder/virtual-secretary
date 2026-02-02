import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export function useSubscription() {
    const [tier, setTier] = useState<'free' | 'pro'>('free');
    const [limit, setLimit] = useState(1);
    const [usage, setUsage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // 1. Get Subscription Tier
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id);

            // Robust handling: If duplicates exist, prefer 'pro'.
            // If data is array (default for select without single), use find/first.
            // If data is object (if single was used, but we removed it), handle that.
            const subscriptions = Array.isArray(sub) ? sub : (sub ? [sub] : []);
            const activeSub = subscriptions.find(s => s.tier === 'pro') || subscriptions[0];

            console.log('Subscription fetch:', subscriptions, activeSub);

            if (activeSub) {
                setTier(activeSub.tier);
                setLimit(activeSub.meetings_limit);
            }

            // 2. Count Meetings (Direct count is safer than relying on sync triggers for now)
            const { count } = await supabase
                .from('meetings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            setUsage(count || 0);
            setLoading(false);
        };

        fetchSubscription();

        const onFocus = () => fetchSubscription();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    return {
        tier,
        limit,
        usage,
        isLimitReached: usage >= limit && tier !== 'pro',
        loading
    };
}
