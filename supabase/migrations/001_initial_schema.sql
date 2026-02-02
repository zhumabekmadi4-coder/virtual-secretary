-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro')) DEFAULT 'free',
    meetings_used INTEGER NOT NULL DEFAULT 0,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    audio_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (
        status IN ('recording', 'processing', 'completed', 'failed')
    ) DEFAULT 'recording',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    segments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id)
);
-- Create meeting_analysis table
CREATE TABLE IF NOT EXISTS public.meeting_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    agenda JSONB NOT NULL DEFAULT '[]'::jsonb,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_meeting_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id)
);
-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_analysis ENABLE ROW LEVEL SECURITY;
-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON public.subscriptions FOR
UPDATE USING (auth.uid() = user_id);
-- RLS Policies for meetings
CREATE POLICY "Users can view their own meetings" ON public.meetings FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own meetings" ON public.meetings FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meetings" ON public.meetings FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meetings" ON public.meetings FOR DELETE USING (auth.uid() = user_id);
-- RLS Policies for transcripts
CREATE POLICY "Users can view transcripts of their meetings" ON public.transcripts FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.meetings
            WHERE meetings.id = transcripts.meeting_id
                AND meetings.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert transcripts for their meetings" ON public.transcripts FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.meetings
            WHERE meetings.id = transcripts.meeting_id
                AND meetings.user_id = auth.uid()
        )
    );
-- RLS Policies for meeting_analysis
CREATE POLICY "Users can view analysis of their meetings" ON public.meeting_analysis FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.meetings
            WHERE meetings.id = meeting_analysis.meeting_id
                AND meetings.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert analysis for their meetings" ON public.meeting_analysis FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.meetings
            WHERE meetings.id = meeting_analysis.meeting_id
                AND meetings.user_id = auth.uid()
        )
    );
-- Create indexes for performance
CREATE INDEX idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX idx_meetings_created_at ON public.meetings(created_at DESC);
CREATE INDEX idx_transcripts_meeting_id ON public.transcripts(meeting_id);
CREATE INDEX idx_analysis_meeting_id ON public.meeting_analysis(meeting_id);
-- Function to auto-create subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.subscriptions (user_id, tier, meetings_used)
VALUES (NEW.id, 'free', 0);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to create subscription on user signup
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers for updated_at
CREATE TRIGGER set_subscriptions_updated_at BEFORE
UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_meetings_updated_at BEFORE
UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();