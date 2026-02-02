import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Fallback for build-time static generation if keys are missing
    if (!supabaseUrl || !supabaseKey) {
        // In browser/runtime, this is a real error. In build-time, it's expected.
        if (typeof window !== 'undefined') {
            console.error('Supabase environment variables are missing! Check your .env.local or Vercel settings.')
        }

        return createBrowserClient(
            'https://placeholder.supabase.co',
            'placeholder'
        )
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}
