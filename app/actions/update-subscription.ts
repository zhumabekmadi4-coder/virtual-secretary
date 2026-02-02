'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function updateSubscription(userId: string) {
    // 1. Verify current user is admin
    // We use the standard server client (cookies) to verify WHO is making the request
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== 'zhumabekmadi4@gmail.com') {
        return { success: false, error: 'Unauthorized: You are not the admin.' }
    }

    // 2. Initialize Admin Client (Bypass RLS)
    // We need the SERVICE_ROLE_KEY for this.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
        return { success: false, error: 'Configuration Error: Missing Service Role Key on server.' }
    }

    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // 3. Update Subscription
    const { error } = await adminClient
        .from('subscriptions')
        .update({
            tier: 'pro',
            meetings_limit: 10000,
            status: 'active'
        })
        .eq('user_id', userId)

    if (error) {
        console.error('Admin update error:', error);
        return { success: false, error: error.message }
    }

    return { success: true }
}
