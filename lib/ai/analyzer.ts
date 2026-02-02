import OpenAI from 'openai';

export async function analyzeTranscript(transcriptText: string): Promise<MeetingAnalysis> {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Or gpt-4o-mini for cost savings
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: transcriptText }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3, // Lower temp for more deterministic analysis
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No analysis generated');

        return JSON.parse(content) as MeetingAnalysis;
    } catch (error) {
        console.error('GPT Analysis Error:', error);
        throw new Error('Analysis failed');
    }
}
const SYSTEM_PROMPT = `
Ты — профессиональный бизнес-ассистент и секретарь. Твоя задача — проанализировать стенограмму встречи и извлечь ключевую информацию.

Входной формат: Текст стенограммы (с разделением по спикерам или сплошной текст).

Требования к анализу:
1. Краткое резюме (Summary): 3-5 предложений, описывающих суть встречи.
2. Повестка (Agenda): О чем говорили (список тем).
3. Задачи (Tasks) и Поручения: Кто, что должен сделать и к какому сроку. Если срок не указан, попробуй понять из контекста или оставь пустым.
4. Решения (Decisions): Что было окончательно решено.
5. Следующая встреча (Next Meeting): Дата/время, если обсуждалось.
6. Тон встречи (Sentiment): positive/neutral/negative.

Формат вывода: Строгий JSON. Без markdown блоков (backticks). Только чистый JSON объект.
Структура JSON:
{
  "summary": "...",
  "agenda": ["..."],
  "tasks": [{ "assignee": "Name", "task": "Description", "deadline": "YYYY-MM-DD" }],
  "decisions": ["..."],
  "next_meeting": "...",
  "sentiment": "..."
}

Язык вывода: Русский.
`;

export async function analyzeTranscript(transcriptText: string): Promise<MeetingAnalysis> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Or gpt-4o-mini for cost savings
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: transcriptText }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3, // Lower temp for more deterministic analysis
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No analysis generated');

        return JSON.parse(content) as MeetingAnalysis;
    } catch (error) {
        console.error('GPT Analysis Error:', error);
        throw new Error('Analysis failed');
    }
}
