import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'coach') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        // Build comprehensive prompt
        const systemPrompt = `You are a professional coaching program builder creating a ${duration}-week online program. 
Your writing style should be warm, supportive, educational, and accessible. You write in ${language === 'da' ? 'Danish' : 'English'}.
You use real-world examples, practical exercises, and reflection questions. Your tone should be ${tonePreference || 'supportive and warm'}.

CRITICAL: Your content must be VALUE-BASED and COMPREHENSIVE. Every message, document, and task should provide genuine insight, knowledge, and understanding—not just surface-level information.

Key principles for value-based content:
- **Explain topics thoroughly**: Don't just mention concepts—explain what they are, why they matter, and how they manifest in real life
- **Provide context and understanding**: Help clients understand the challenges they face, the root causes, and how different methods work
- **Equip clients with knowledge**: Give clients insight and understanding so they are better equipped throughout their journey
- **Go beyond the obvious**: Explain what things really are (not just "stress is bad" but "stress shows up as a constantly switched-on mind, irritability, poor sleep, tension in the body, low patience, or feeling like you're carrying everything alone")
- **Connect theory to practice**: Show how concepts apply to real-world situations and specific scenarios
- **Explain methods and approaches**: Don't just list tools—explain how they work, why they're effective, and when to use them
- **Build foundational understanding**: Provide the "why" behind the "what" so clients can make informed decisions

Additional principles:
- Use real-world case studies with specific scenarios when appropriate
- Explain concepts simply but professionally with depth
- Include practical, actionable exercises with context
- Ask reflection questions that build self-awareness and understanding
- Provide encouragement throughout while maintaining educational value
- Adapt content depth to: ${contentDepth || 'moderate'} (but always prioritize value over brevity)
- Maintain professional quality standards
- Use emojis sparingly and appropriately (1-2 per message/document, only when they add value and warmth)
- Emojis should feel natural and not overwhelming

Always return valid JSON.`;

        const userPrompt = `Create a comprehensive, value-based ${duration}-week program called "${programName}".

${programDescription ? `Program Description: ${programDescription}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${specificTopics ? `Specific Topics to Include: ${specificTopics}` : ''}
${specialInstructions ? `Special Instructions: ${specialInstructions}` : ''}

Content Requirements:
- Tone: ${tonePreference || 'Supportive and warm'}
- Content Depth: ${contentDepth || 'Moderate detail'} (but always prioritize comprehensive, value-based content)
- Document Structure: ${documentStructure || 'Moderate (sections + exercises)'}
- Message Frequency: ${messageFrequency || 'Every 2-3 days'}
- Task Types: ${taskTypes?.join(', ') || 'Reflection exercises, Action items'}

VALUE-BASED CONTENT STANDARDS (applies to ALL content - messages, documents, and tasks):
- Every piece of content must explain topics thoroughly, not just mention them
- Provide understanding of challenges (what they are, how they manifest, why they occur)
- Explain methods and approaches (how they work, why they're effective, when to use them)
- Equip clients with insight and knowledge they can use throughout the program
- Go beyond surface-level content—provide genuine educational value
- Help clients understand the "why" behind concepts, not just the "what"
- Connect theory to real-world scenarios and specific situations

Generate:
1. **Messages**: Create messages distributed according to frequency (${messageFrequency || 'Every 2-3 days'}). 
   CRITICAL: Each message must be VALUE-BASED and COMPREHENSIVE:
   - Explain topics thoroughly (what they are, why they matter, how they manifest)
   - Provide understanding of challenges and their root causes
   - Explain methods and approaches with context
   - Equip clients with insight and knowledge
   - Go beyond obvious statements—provide real understanding
   - Each message should be warm, supportive, and educational with substantial content
   - Include references to documents or exercises when relevant
   - Use 1-2 emojis per message sparingly (like 😊, 💚, 🙌, 💪, ❤️) to add warmth without being excessive
   - Distribute them across all ${duration} weeks
   - Example: Instead of "Welcome! We'll work on stress management," write "Welcome! Over the next ${duration} weeks, we'll focus on practical, evidence-informed ways to manage stress. Stress often isn't just 'too much to do'—it can show up as a constantly switched-on mind, irritability, poor sleep, tension in the body, low patience, or feeling like you're carrying everything alone. When life is full, the usual advice can feel unrealistic, so this program is designed to work within your real schedule, not against it."

2. **Tasks**: Create tasks based on selected types: ${taskTypes?.join(', ') || 'Reflection exercises, Action items'}.
   - Each task should include context and explanation of why it's valuable
   - Provide understanding of what the task will help them learn or achieve
   - Use emojis very sparingly in task titles or descriptions (0-1 per task, only when appropriate)
   - Distribute them across weeks, ensuring variety

3. **Weekly Documents**: Create one document per week (${duration} documents total).
   CRITICAL: Each document must be VALUE-BASED and COMPREHENSIVE, just like messages:
   - Each document should match the structure preference: ${documentStructure || 'Moderate (sections + exercises)'}
   - Week overview: Provide a thorough, value-based overview that explains the week's focus, why it matters, and how it fits into the overall program journey
   - Key concepts: Don't just list concepts—explain them thoroughly:
     * What each concept is and why it matters
     * How it manifests in real life with specific examples
     * The challenges related to it and their root causes
     * How understanding this concept helps the client
   - Exercises: Include practical exercises with context:
     * Explain what each exercise is designed to achieve
     * Provide clear instructions with the "why" behind each step
     * Explain how the exercise connects to the concepts being learned
   - Reflection questions: Create questions that build understanding and self-awareness:
     * Questions should help clients connect concepts to their own experience
     * Questions should deepen understanding, not just prompt surface-level answers
   - Throughout the document: Explain methods and approaches thoroughly—how they work, why they're effective, and when to use them
   - Equip clients with insight and knowledge throughout—help them understand the "why" behind everything
   - Use emojis very sparingly (1-2 per document total, only in headings or key sections for emphasis)
   - Each document should be substantial and provide genuine educational value

4. **Messages Document**: Create one compiled document containing all text messages with full value-based content.

Return a JSON object with this exact structure:
{
  "elements": [
    {
      "type": "message",
      "week": 1,
      "day": 1,
      "title": "Message Title",
      "data": {
        "message": "Full message text...",
        "isAutomatic": true
      }
    },
    {
      "type": "task",
      "week": 1,
      "day": 3,
      "title": "Task Title",
      "data": {
        "title": "Task Title",
        "description": "Task description...",
        "assignedTo": "client"
      }
    }
  ],
  "documents": [
    {
      "week": 1,
      "title": "Week 1: [Theme]",
      "content": "Full markdown content for week 1 guide..."
    }
  ],
  "messagesDocument": {
    "title": "All Program Messages - ${programName}",
    "content": "Compiled document with all messages..."
  }
}

Ensure:
- Messages are distributed according to frequency
- Tasks match selected types
- Documents match structure preference
- Content depth matches requirement
- Tone matches preference
- All content is in ${language === 'da' ? 'Danish' : 'English'}
- ALL content (messages, documents, tasks) is VALUE-BASED, COMPREHENSIVE, and provides genuine insight and understanding`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        // Debug: Log completion structure
        console.log('Completion object:', JSON.stringify(completion, null, 2));
        console.log('Choices length:', completion.choices?.length);
        console.log('First choice:', completion.choices?.[0]);

        // Check if choices exist
        if (!completion.choices || completion.choices.length === 0) {
            console.error('No choices in completion:', completion);
            throw new Error('No choices returned from OpenAI API');
        }

        // Check if response was truncated
        const finishReason = completion.choices[0]?.finish_reason;
        if (finishReason === 'length') {
            console.warn('OpenAI response was truncated due to token limit');
        }

        // Get the response content
        const responseContent = completion.choices[0]?.message?.content;

        if (!responseContent) {
            console.error('No content in response. Full completion:', JSON.stringify(completion, null, 2));
            console.error('Finish reason:', finishReason);
            console.error('Message object:', completion.choices[0]?.message);
            throw new Error(`No content received from OpenAI. Finish reason: ${finishReason || 'unknown'}`);
        }

        // Try to parse JSON, with better error handling
        let generatedData;
        try {
            // Clean the response content (remove any markdown code blocks if present)
            let cleanedContent = responseContent.trim();
            if (cleanedContent.startsWith('```json')) {
                cleanedContent = cleanedContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedContent.startsWith('```')) {
                cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            generatedData = JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response content length:', responseContent.length);
            console.error('Response content (first 500 chars):', responseContent.substring(0, 500));
            console.error('Finish reason:', finishReason);

            // If response was truncated, suggest increasing token limit
            if (finishReason === 'length') {
                throw new Error(`Response was truncated. Try increasing max_completion_tokens. Partial response: ${responseContent.substring(0, 200)}...`);
            }

            throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
        }

        // Validate structure
        if (!generatedData.elements || !Array.isArray(generatedData.elements)) {
            generatedData.elements = [];
        }
        if (!generatedData.documents || !Array.isArray(generatedData.documents)) {
            generatedData.documents = [];
        }
        if (!generatedData.messagesDocument) {
            generatedData.messagesDocument = {
                title: `All Program Messages - ${programName}`,
                content: "Messages will be compiled here."
            };
        }

        return NextResponse.json(generatedData);
    } catch (error) {
        console.error('AI generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate program' },
            { status: 500 }
        );
    }
}

