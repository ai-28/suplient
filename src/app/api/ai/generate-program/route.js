import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Set max duration to match nginx timeout (600 seconds = 10 minutes)
export const maxDuration = 600;

export async function POST(request) {
    try {
        // 1️⃣ Auth check
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'coach') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2️⃣ Get request body
        const questionnaireData = await request.json();
        const {
            programName,
            programDescription,
            duration,
            targetAudience,
            tonePreference,
            contentDepth,
            messageFrequency,
            taskTypes,
            documentStructure,
            specificTopics,
            specialInstructions,
            language = 'en'
        } = questionnaireData;

        if (!programName || !duration) {
            return NextResponse.json(
                { error: 'Program name and duration are required' },
                { status: 400 }
            );
        }

        // 3️⃣ Build system prompt
        const systemPrompt = `You are a professional coaching program builder creating a ${duration}-week online program.
Your writing style should be warm, supportive, educational, and accessible. You write in ${language === 'da' ? 'Danish' : 'English'}.
Use real-world examples, practical exercises, and reflection questions. Tone: ${tonePreference || 'supportive and warm'}.

CRITICAL CONSTRAINT: The "day" field in elements must ALWAYS be an integer between 1 and 7 (day of week: 1=Monday, 2=Tuesday, ..., 7=Sunday). 
Never use day values outside 1-7. For each week, use only days 1-7.

FORMATTING RULES:
- DO NOT use markdown formatting like asterisks (*, **, ***) for bold or emphasis
- DO NOT use markdown syntax in content (no **bold**, no *italic*, no # headers in message/task content)
- Write content in plain text only
- Use simple line breaks for paragraphs

Always return valid JSON matching the structure requested.`;

        // 4️⃣ Build user prompt
        const userPrompt = `Create a comprehensive ${duration}-week program called "${programName}".

${programDescription ? `Program Description: ${programDescription}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${specificTopics ? `Specific Topics to Include: ${specificTopics}` : ''}
${specialInstructions ? `Special Instructions: ${specialInstructions}` : ''}

Content Requirements:
- Tone: ${tonePreference || 'Supportive and warm'}
- Content Depth: ${contentDepth || 'moderate'}
- Document Structure: ${documentStructure || 'Moderate (sections + exercises)'}
- Message Frequency: ${messageFrequency}
- Task Types: ${taskTypes?.join(', ') || 'Reflection exercises, Action items'}

Return a JSON object with this exact structure:
{
  "elements": [
    { "type": "message", "week": 1, "day": 1, "title": "Message Title", "data": { "message": "Full message text...", "isAutomatic": true } },
    { "type": "task", "week": 1, "day": 3, "title": "Task Title", "data": { "title": "Task Title", "description": "Task description...", "assignedTo": "client" } }
  ],
  "documents": [
    { "week": 1, "title": "Week 1: [Theme]", "content": "Full markdown content for week 1 guide..." }
  ],
  "messagesDocument": {
    "title": "All Program Messages - ${programName}",
    "content": "Compiled document with all messages..."
  }
}

⚠️ CRITICAL: The "day" field MUST be 1-7 (day of week) for ALL elements:
- NEVER use day values like 8, 9, 10, etc. - these will cause errors!
- For each week (1, 2, 3, etc.), use only days 1-7
- Example: Week 1 can have day:1, day:2, ..., day:7. Week 2 also uses day:1, day:2, ..., day:7.

Ensure:
- Messages are distributed according to frequency
- Tasks match selected types
- Documents match structure preference
- Content depth matches requirement
- Tone matches preference
- All content is in ${language === 'da' ? 'Danish' : 'English'}
- NO markdown formatting (no asterisks *, **, ***) - use plain text only
- reduce large content texts by 25% for the messages and tasks.`;

        // 5️⃣ Generate program using Responses API
        // For large programs, consider weekly chunking to avoid token limits
        const completion = await openai.responses.create({
            model: 'gpt-5.2',
            input: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_output_tokens: 20000 // adjust if needed
        });

        // 6️⃣ Extract output text (Responses API uses output_text)
        let responseContent = completion.output_text;

        if (!responseContent) {
            console.error('No content in response:', completion);
            throw new Error('No content received from GPT.');
        }

        // 7️⃣ Clean up markdown/code blocks
        responseContent = responseContent.trim()
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```$/, '');

        // 8️⃣ Parse JSON safely
        let generatedData;
        try {
            generatedData = JSON.parse(responseContent);
        } catch (parseError) {
            console.error('Failed to parse JSON. Partial response:', responseContent.substring(0, 500));
            throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
        }

        // 9️⃣ Validate structure
        if (!generatedData.elements || !Array.isArray(generatedData.elements)) {
            generatedData.elements = [];
        }
        if (!generatedData.documents || !Array.isArray(generatedData.documents)) {
            generatedData.documents = [];
        }
        if (!generatedData.messagesDocument) {
            generatedData.messagesDocument = {
                title: `All Program Messages - ${programName}`,
                content: 'Messages will be compiled here.'
            };
        }

        // 🔟 Clean up markdown asterisks from all content
        const cleanMarkdownAsterisks = (text) => {
            if (typeof text !== 'string') return text;
            // Remove markdown bold/emphasis: **text**, *text*, ***text***
            // Use [\s\S] instead of . to match newlines as well
            return text
                .replace(/\*\*\*([\s\S]*?)\*\*\*/g, '$1') // Remove ***text***
                .replace(/\*\*([\s\S]*?)\*\*/g, '$1')     // Remove **text**
                .replace(/\*([\s\S]*?)\*/g, '$1')         // Remove *text* (but be careful with lists)
                .trim();                                   // Remove leading/trailing whitespace
        };

        // Clean elements (messages and tasks)
        if (generatedData.elements) {
            generatedData.elements.forEach(element => {
                // Clean top-level title
                if (element.title) {
                    element.title = cleanMarkdownAsterisks(element.title);
                }
                // Clean data fields
                if (element.data) {
                    if (element.data.message) {
                        element.data.message = cleanMarkdownAsterisks(element.data.message);
                    }
                    if (element.data.description) {
                        element.data.description = cleanMarkdownAsterisks(element.data.description);
                    }
                    if (element.data.title) {
                        element.data.title = cleanMarkdownAsterisks(element.data.title);
                    }
                }
            });
        }

        // Clean documents
        if (generatedData.documents) {
            generatedData.documents.forEach(doc => {
                // Clean document title
                if (doc.title) {
                    doc.title = cleanMarkdownAsterisks(doc.title);
                }
                // Clean document content
                if (doc.content) {
                    doc.content = cleanMarkdownAsterisks(doc.content);
                }
            });
        }

        // Clean messagesDocument
        if (generatedData.messagesDocument) {
            if (generatedData.messagesDocument.title) {
                generatedData.messagesDocument.title = cleanMarkdownAsterisks(generatedData.messagesDocument.title);
            }
            if (generatedData.messagesDocument.content) {
                generatedData.messagesDocument.content = cleanMarkdownAsterisks(generatedData.messagesDocument.content);
            }
        }

        // 1️⃣1️⃣ Return response
        return NextResponse.json(generatedData);

    } catch (error) {
        console.error('AI generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate program' },
            { status: 500 }
        );
    }
}
