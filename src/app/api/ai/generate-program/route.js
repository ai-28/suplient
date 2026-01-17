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
   CRITICAL DISTRIBUTION RULES:
   - You MUST generate content for ALL ${duration} weeks, not just one week
   - Messages should be distributed ONE PER DAY according to the frequency (e.g., "Every 2-3 days" means one message every 2-3 days)
   - DO NOT place multiple messages on the same day - each day should have at most ONE message
   - Spread messages evenly across all ${duration} weeks (total of ${duration * 7} days)
   - Example: For a 4-week program with "Every 2-3 days" frequency, you might have messages on days: 1, 3, 6, 8, 11, 13, 16, 18, 21, 23, 26, 28 (approximately 12 messages total)
   
   CRITICAL: Each message must be VALUE-BASED and COMPREHENSIVE with SUBSTANTIAL CONTENT:
   - Messages should be LONG and DETAILED (typically 200-400 words), not short or superficial
   - Explain topics thoroughly: What they are, why they matter, how they manifest in real life with specific examples
   - Provide deep understanding of challenges: What the challenges are, how they show up, why they occur, their root causes
   - Explain methods and approaches comprehensively: How they work, why they're effective, when to use them, what to expect
   - Equip clients with insight and knowledge: Give them understanding they can use throughout the program
   - Go beyond obvious statements—provide real understanding and context
   - Each message should be warm, supportive, and educational with substantial, meaningful content
   - Include references to documents or exercises when relevant
   - Use 1-2 emojis per message sparingly (like 😊, 💚, 🙌, 💪, ❤️) to add warmth without being excessive
   - BAD EXAMPLE (too basic): "Welcome to the start of a transformative journey towards better sleep! Over the next 4 weeks, we'll explore sleep in depth, understanding how it affects every aspect of our lives. Sleep isn't just about feeling rested; it's crucial for our mental, emotional, and physical well-being. Many face challenges like insomnia or restless nights, often stemming from stress, lifestyle habits, or even environmental factors. Together, we'll work to identify causes and implement practical solutions that fit into your lifestyle. 🌙"
   - GOOD EXAMPLE (comprehensive): "Welcome! Over the next ${duration} weeks, we'll focus on practical, evidence-informed ways to manage stress. Stress often isn't just 'too much to do'—it can show up as a constantly switched-on mind, irritability, poor sleep, tension in the body, low patience, or feeling like you're carrying everything alone. When life is full, the usual advice ('just relax' or 'take more time off') can feel unrealistic—so this program is designed to work within your real schedule, not against it. Here's what we'll work on together: Understanding your stress patterns (what triggers you, how stress shows up in your body and behavior, and what keeps the cycle going). Regulating your nervous system quickly (short, effective tools you can use in 2–10 minutes to reduce pressure in the moment, even on busy days). Building sustainable habits (small changes that improve sleep, energy, focus, and recovery without requiring a major lifestyle overhaul). Strengthening boundaries and mindset (practical ways to handle workload, expectations, and self-talk so stress doesn't run the show). By the end, you'll have a clear toolkit you can rely on—methods that are simple, repeatable, and tailored to your life—so you feel more in control, more steady, and better equipped to handle challenges as they come."

2. **Tasks**: Create tasks based on selected types: ${taskTypes?.join(', ') || 'Reflection exercises, Action items'}.
   - Each task should include context and explanation of why it's valuable
   - Provide understanding of what the task will help them learn or achieve
   - Use emojis very sparingly in task titles or descriptions (0-1 per task, only when appropriate)
   - Distribute them across all ${duration} weeks, ensuring variety
   - IMPORTANT: A task can be on the SAME day as a message (e.g., Week 1 Day 1 can have both a message AND a task)
   - Tasks can also be on days without messages
   - However, remember: each day should have at most ONE message (messages are distributed one per day)

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

CRITICAL DISTRIBUTION RULES:
- You MUST generate content for ALL ${duration} weeks (not just one week)
- Messages: ONE message per day maximum, distributed according to frequency across all ${duration} weeks
- Tasks: Can be on the same day as a message OR on separate days
- Example pattern: Week 1 Day 1 (message), Week 1 Day 1 (task), Week 1 Day 3 (message), Week 1 Day 5 (message + task), Week 2 Day 1 (message), etc.
- Create a rich program spanning all ${duration} weeks with messages distributed one per day and tasks strategically placed

Return a JSON object with this exact structure (NOTE: You must include elements for ALL ${duration} weeks, not just week 1):
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
      "day": 1,
      "title": "Task Title",
      "data": {
        "title": "Task Title",
        "description": "Task description...",
        "assignedTo": "client"
      }
    },
    {
      "type": "message",
      "week": 1,
      "day": 3,
      "title": "Next Message Title",
      "data": {
        "message": "Full message text...",
        "isAutomatic": true
      }
    },
    {
      "type": "message",
      "week": 2,
      "day": 1,
      "title": "Week 2 Message Title",
      "data": {
        "message": "Full message text...",
        "isAutomatic": true
      }
    }
    // ... continue for ALL ${duration} weeks with messages distributed one per day
  ],
  "documents": [
    {
      "week": 1,
      "title": "Week 1: [Theme]",
      "content": "Full markdown content for week 1 guide..."
    },
    {
      "week": 2,
      "title": "Week 2: [Theme]",
      "content": "Full markdown content for week 2 guide..."
    }
    // ... continue for ALL ${duration} weeks
  ],
  "messagesDocument": {
    "title": "All Program Messages - ${programName}",
    "content": "Compiled document with all messages..."
  }
}

Ensure:
- You generate content for ALL ${duration} weeks (not just one week)
- Messages are distributed ONE PER DAY according to frequency across all ${duration} weeks
- Each day has at most ONE message (do not place multiple messages on the same day)
- Tasks can be on the same day as a message OR on separate days
- Tasks match selected types
- Documents match structure preference (one document per week for all ${duration} weeks)
- Content depth matches requirement
- Tone matches preference
- All content is in ${language === 'da' ? 'Danish' : 'English'}
- ALL content (messages, documents, tasks) is VALUE-BASED, COMPREHENSIVE, and provides genuine insight and understanding
- Messages are SUBSTANTIAL (200-400 words typically) with deep explanations, not short or superficial`;

        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });
        } catch (apiError) {
            console.error('OpenAI API error:', apiError);
            // Handle specific OpenAI API errors
            if (apiError.status === 401) {
                throw new Error('OpenAI API authentication failed. Please check your API key.');
            } else if (apiError.status === 429) {
                throw new Error('OpenAI API rate limit exceeded. Please try again later.');
            } else if (apiError.status === 500 || apiError.status === 503) {
                throw new Error('OpenAI API service is temporarily unavailable. Please try again later.');
            } else {
                throw new Error(`OpenAI API error: ${apiError.message || 'Unknown error'}`);
            }
        }

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
            throw new Error('Response was too long and got truncated. The program may be incomplete. Try reducing the program duration or simplifying the requirements.');
        }

        // Get the response content
        const responseContent = completion.choices[0]?.message?.content;

        if (!responseContent) {
            console.error('No content in response. Full completion:', JSON.stringify(completion, null, 2));
            console.error('Finish reason:', finishReason);
            console.error('Message object:', completion.choices[0]?.message);
            throw new Error(`No content received from OpenAI. Finish reason: ${finishReason || 'unknown'}`);
        }

        // Check if response is HTML (error page)
        if (responseContent.trim().startsWith('<') || responseContent.includes('<html>') || responseContent.includes('<!DOCTYPE')) {
            console.error('Received HTML instead of JSON. Response:', responseContent.substring(0, 500));
            throw new Error('Received an error page instead of JSON. This may indicate an API error or network issue. Please try again.');
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

            // Check if it's HTML
            if (responseContent.includes('<html>') || responseContent.includes('<!DOCTYPE')) {
                throw new Error('Received HTML error page instead of JSON. Please check your API configuration and try again.');
            }

            throw new Error(`Failed to parse AI response as JSON: ${parseError.message}. Response preview: ${responseContent.substring(0, 200)}...`);
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

