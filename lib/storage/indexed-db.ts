import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MeetingAudioDB extends DBSchema {
    chunks: {
        key: number;
        value: {
            meetingId: string;
            timestamp: number;
            blob: Blob;
        };
        indexes: { 'by-meeting': string };
    };
    meetings: {
        key: string;
        value: {
            id: string;
            title: string;
            startTime: number;
            duration: number;
            status: 'recording' | 'paused' | 'stopped' | 'uploaded';
            synced: boolean;
        };
    };
}

const DB_NAME = 'virtual-secretary-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MeetingAudioDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<MeetingAudioDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Store for audio chunks
                const chunkStore = db.createObjectStore('chunks', {
                    keyPath: 'timestamp',
                    autoIncrement: true,
                });
                chunkStore.createIndex('by-meeting', 'meetingId');

                // Store for meeting metadata (offline support)
                if (!db.objectStoreNames.contains('meetings')) {
                    db.createObjectStore('meetings', { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

export const saveAudioChunk = async (meetingId: string, blob: Blob) => {
    const db = await initDB();
    await db.add('chunks', {
        meetingId,
        timestamp: Date.now(),
        blob,
    });
};

export const getMeetingChunks = async (meetingId: string) => {
    const db = await initDB();
    return db.getAllFromIndex('chunks', 'by-meeting', meetingId);
};

export const deleteMeetingChunks = async (meetingId: string) => {
    const db = await initDB();
    const tx = db.transaction('chunks', 'readwrite');
    const index = tx.store.index('by-meeting');
    let cursor = await index.openCursor(IDBKeyRange.only(meetingId));

    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
};

export const saveOfflineMeeting = async (meeting: MeetingAudioDB['meetings']['value']) => {
    const db = await initDB();
    await db.put('meetings', meeting);
};

export const getOfflineMeetings = async () => {
    const db = await initDB();
    return db.getAll('meetings');
};
