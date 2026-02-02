'use client';

export async function uploadAudioChunk(meetingId: string, chunk: Blob, chunkIndex: number) {
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('meetingId', meetingId);
    formData.append('chunkId', `${chunkIndex}_${Date.now()}`);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload chunk');
    }

    return response.json();
}
