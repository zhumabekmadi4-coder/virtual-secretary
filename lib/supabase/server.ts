import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Fallback for build-time static generation if keys are missing
    if (!supabaseUrl || !supabaseKey) {
        return createServerClient(
            'https://placeholder.supabase.co',
            'placeholder',
            { cookies: { getAll: () => [], setAll: () => { } } }
        )
    }

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    } catch (error) {
                        // Server Component - cookies can only be modified in Server Action or Route Handler
                    }
                },
            },
        }
    )
}
