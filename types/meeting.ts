export interface User {
    id: string
    email: string
    created_at: string
}

export interface Meeting {
    id: string
    user_id: string
    title: string
    audio_url: string
    duration_seconds: number
    status: 'recording' | 'processing' | 'completed' | 'failed'
    created_at: string
    updated_at: string
}

export interface Transcript {
    id: string
    meeting_id: string
    segments: TranscriptSegment[]
    created_at: string
}

export interface TranscriptSegment {
    speaker_id: number
    speaker_name?: string
    text: string
    start_time: number
    end_time: number
}

export interface MeetingAnalysis {
    meeting_id: string
    summary: string
    agenda: string[]
    tasks: Task[]
    decisions: string[]
    next_meeting_date: string | null
    created_at: string
}

export interface Task {
    assignee: string
    task: string
    deadline: string | null
}
