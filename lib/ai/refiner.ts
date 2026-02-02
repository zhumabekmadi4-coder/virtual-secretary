import OpenAI from 'openai';

const SYSTEM_PROMPT = `
Ты — профессиональный редактор текста. 
Твоя задача — улучшить читаемость стенограммы встречи, сохранив 100% смысла и оригинальных формулировок.

Правила редактирования:
1. Исправь грамматические и пунктуационные ошибки.
2. Убери слова-паразиты (эээ, ммм, ну, типа), если они не несут смысловой нагрузки.
3. Разбей текст на логические абзацы для удобства чтения.
4. Расставь заглавные буквы и правильные знаки препинания в конце предложений.
5. НЕ меняй стиль речи спикеров и НЕ удаляй важные детали.
6. Если текст разделен на спикеров, сохрани структуру.

Язык: Русский.
`;

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
