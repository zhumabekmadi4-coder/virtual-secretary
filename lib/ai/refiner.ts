import OpenAI from 'openai';

export async function refineTranscript(rawText: string): Promise<string> {
    if (!rawText || rawText.length < 10) return rawText;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: rawText }
            ],
            temperature: 0.3,
        });

        return response.choices[0].message.content || rawText;
    } catch (error) {
        console.error('Transcript Refinement Error:', error);
        return rawText; // Fallback to raw text if AI fails
    }
}
