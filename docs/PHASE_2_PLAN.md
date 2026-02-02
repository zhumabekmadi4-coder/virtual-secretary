# PHASE 2: Audio Recording Implementation Plan

## 🎯 Objective
Implement a robust, mobile-first audio recording interface that works offline, prevents device sleep, and syncs data to Supabase when online.

## 👥 Agent Roles

### 1. Frontend Specialist (UI/UX & Browser APIs)
- **Focus:** `useAudioRecorder` hook, Visualizer, Wake Lock, UI Components.
- **Key Files:**
  - `hooks/useAudioRecorder.ts`
  - `components/recorder/AudioRecorder.tsx`
  - `components/recorder/WaveformVisualizer.tsx`
  - `lib/audio/recorder.ts`

### 2. Backend Specialist (Data & Storage)
- **Focus:** IndexedDB storage, Supabase Storage upload, Background Sync.
- **Key Files:**
  - `lib/storage/indexed-db.ts`
  - `lib/storage/upload.ts`
  - `app/api/upload/route.ts` (if needed for signed URLs)

## 🛠 Technical Specification

### 1. Audio Recorder Hook (`useAudioRecorder`)
- **State:** `isRecording`, `isPaused`, `duration`, `audioLevel` (for visualizer).
- **Methods:** `startRecording`, `stopRecording`, `pauseRecording`, `resumeRecording`.
- **Config:**
  - MIME type detection (`audio/webm;codecs=opus` preferred).
  - Timeslice: 1000ms (for visuals) or larger for storage.
  - **Critical:** Automatic chunking to avoid memory issues on long recordings (1hr+).

### 2. Offline Storage (IndexedDB using `idb` library)
- **Database:** `meeting_audio`
- **Store:** `chunks`
- **Schema:** `{ id: auto, meetingId: uuid, timestamp: number, blob: Blob }`
- **Logic:**
  - On `dataavailable`: Save chunk to IndexedDB immediately.
  - On `stop`: Combine chunks (if short) or prepare for upload.

### 3. Wake Lock API
- Request `screen` wake lock on recording start.
- Release on stop.
- Handle visibility change (re-aquire if tab becomes active).

### 4. UI Components
- **Main Record Button:** 80x80px minimum, bottom centered. Pulse animation when recording.
- **Visualizer:** Simple Canvas-based waveform using `AnalyserNode`.
- **Timer:** Big font, visible contrast.

## 📝 Implementation Steps

### Step 1: Foundation (Backend Specialist)
1. Setup `idb` for IndexedDB interactions.
2. Create `lib/storage/local-audio.ts` for saving/retrieving chunks.

### Step 2: Hook Logic (Frontend Specialist)
1. Implement `useAudioRecorder` with MediaRecorder API.
2. Integrate Wake Lock API.
3. Connect to `local-audio.ts`.

### Step 3: UI Implementation (Frontend Specialist)
1. Build `AudioVisualizer` component.
2. Build `RecorderControls` component.
3. Assemble `app/(dashboard)/record/page.tsx`.

### Step 4: Storage Integration (Backend Specialist)
1. Implement upload logic to Supabase Storage.
2. Handle network interruptions (retry logic).

## ✅ Verification Criteria
- [ ] Record 1 hour audio without crash.
- [ ] Screen stays on on mobile.
- [ ] Audio saved to Supabase (chunks or full file).
- [ ] Works in Airplane mode (saves locally).
