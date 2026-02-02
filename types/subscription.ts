export type SubscriptionTier = 'free' | 'pro'

export interface Subscription {
    id: string
    user_id: string
    tier: SubscriptionTier
    meetings_used: number
    stripe_customer_id?: string
    stripe_subscription_id?: string
    created_at: string
    updated_at: string
}

export const SUBSCRIPTION_LIMITS = {
    free: {
        max_meetings: 1,
        storage_days: 7,
    },
    pro: {
        max_meetings: Infinity,
        storage_days: 365,
    },
} as const
