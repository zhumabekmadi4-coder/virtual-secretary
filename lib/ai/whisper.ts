import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(input: File | Blob | Buffer, filename: string = 'recording.webm') {
    try {
        let fileForOpenAI;

        // Ensure we have a format OpenAI accepts (File-like)
        if (Buffer.isBuffer(input)) {
            fileForOpenAI = await toFile(input, filename, { type: 'audio/webm' });
        } else if (input instanceof File) {
            // In Node environment, File objects might need conversion or just work.
            // Converting to buffer then toFile is safest to ensure headers are right.
            const arrayBuffer = await input.arrayBuffer();
            fileForOpenAI = await toFile(Buffer.from(arrayBuffer), input.name, { type: input.type });
        } else {
            // Fallback for Blob
            fileForOpenAI = input;
        }

        console.log('Sending to Whisper:', filename);

        const response = await openai.audio.transcriptions.create({
            file: fileForOpenAI as any,
            model: 'whisper-1',
            language: 'ru',
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
            prompt: 'Разговор на деловой встрече, стартап, создание бизнеса, инвестиции, веб-разработка, дизайн, маркетинг. Четкая речь, профессиональные термины.',
        });

        return response;
    } catch (error) {
        console.error('Whisper API Error:', error);
        throw error; // Re-throw to be caught by route handler
    }
}
