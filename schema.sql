-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- Create tables
create table if not exists users (
    id uuid references auth.users not null primary key,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create table if not exists subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references users(id) not null,
    tier text check (tier in ('free', 'pro')) default 'free',
    status text check (status in ('active', 'cancelled', 'expired')) default 'active',
    meetings_limit integer default 1,
    meetings_used integer default 0,
    storage_days integer default 7,
    valid_until timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create table if not exists meetings (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references users(id) not null,
    title text not null default 'Новая встреча',
    date timestamp with time zone default timezone('utc'::text, now()) not null,
    duration integer default 0,
    audio_url text,
    -- Supabase Storage URL or Yandex Object Storage URL
    status text check (
        status in (
            'recording',
            'uploaded',
            'processing',
            'completed',
            'error'
        )
    ) default 'recording',
    speakers_count integer default 1,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create table if not exists transcripts (
    id uuid default uuid_generate_v4() primary key,
    meeting_id uuid references meetings(id) on delete cascade not null,
    language text default 'ru',
    full_text text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create table if not exists transcript_segments (
    id uuid default uuid_generate_v4() primary key,
    transcript_id uuid references transcripts(id) on delete cascade not null,
    speaker_label text not null,
    -- "Speaker 1", "Speaker 2", etc.
    text text not null,
    start_time float not null,
    end_time float not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create table if not exists analysis (
    id uuid default uuid_generate_v4() primary key,
    meeting_id uuid references meetings(id) on delete cascade not null,
    summary text,
    key_points text [],
    analysis jsonb,
    -- Legacy, removal pending
    tasks jsonb,
    -- Array of { task: string, assignee?: string, deadline?: string }
    decisions jsonb,
    -- Added missing decisions
    sentiment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS Policies
alter table users enable row level security;
alter table subscriptions enable row level security;
alter table meetings enable row level security;
alter table transcripts enable row level security;
alter table transcript_segments enable row level security;
alter table analysis enable row level security;
-- Users policies
create policy "Users can view their own profile" on users for
select using (auth.uid() = id);
create policy "Users can update their own profile" on users for
update using (auth.uid() = id);
-- Subscriptions policies
create policy "Users can view their own subscription" on subscriptions for
select using (auth.uid() = user_id);
-- Meetings policies
create policy "Users can view their own meetings" on meetings for
select using (auth.uid() = user_id);
create policy "Users can insert their own meetings" on meetings for
insert with check (auth.uid() = user_id);
create policy "Users can update their own meetings" on meetings for
update using (auth.uid() = user_id);
create policy "Users can delete their own meetings" on meetings for delete using (auth.uid() = user_id);
-- Transcripts policies (Cascade from meeting)
create policy "Users can view transcripts of their meetings" on transcripts for
select using (
        exists (
            select 1
            from meetings
            where id = transcripts.meeting_id
                and user_id = auth.uid()
        )
    );
create policy "Users can insert transcripts for their meetings" on transcripts for
insert with check (
        exists (
            select 1
            from meetings
            where id = meeting_id
                and user_id = auth.uid()
        )
    );
-- Transcript Segments policies (Cascade from transcript -> meeting)
create policy "Users can view segments of their meetings" on transcript_segments for
select using (
        exists (
            select 1
            from transcripts
                join meetings on meetings.id = transcripts.meeting_id
            where transcripts.id = transcript_segments.transcript_id
                and meetings.user_id = auth.uid()
        )
    );
create policy "Users can insert segments for their meetings" on transcript_segments for
insert with check (
        exists (
            select 1
            from transcripts
                join meetings on meetings.id = transcripts.meeting_id
            where transcripts.id = transcript_id
                and meetings.user_id = auth.uid()
        )
    );
-- Analysis policies (Cascade from meeting)
create policy "Users can view analysis of their meetings" on analysis for
select using (
        exists (
            select 1
            from meetings
            where id = analysis.meeting_id
                and user_id = auth.uid()
        )
    );
create policy "Users can insert analysis for their meetings" on analysis for
insert with check (
        exists (
            select 1
            from meetings
            where id = meeting_id
                and user_id = auth.uid()
        )
    );
-- Functions
-- Function to handle new user signup
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.users (id, email, full_name, avatar_url)
values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
-- Create default free subscription
insert into public.subscriptions (user_id, tier, meetings_limit, meetings_used)
values (new.id, 'free', 1, 0);
return new;
end;
$$ language plpgsql security definer;
-- Trigger for new user
create trigger on_auth_user_created
after
insert on auth.users for each row execute procedure public.handle_new_user();