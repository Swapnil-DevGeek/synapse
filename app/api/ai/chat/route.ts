import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { type Session } from 'next-auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';
import { authOptions } from '../../auth/[...nextauth]/route';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session: Session | null = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { noteId, question, noteContent } = await request.json();

    if (!noteId || !question) {
      return NextResponse.json(
        { error: 'Note ID and question are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Verify note ownership
    const note = await Note.findOne({
      _id: noteId,
      userId: session.user.id,
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Prepare the prompt for Gemini
    const prompt = `You are an expert AI assistant. Your primary task is to answer the user's question based on the provided note content.

**Note Title:**
${note.title}

**Note Content:**
${noteContent || note.content}

---

**User's Question:**
${question}

---

**Instructions:**
1.  **Greeting Handling:** If the user's question is a simple, common greeting (e.g., "hi", "hello", "hey"), respond with a brief, friendly greeting and ask how you can help with the note. Do not use the note content for this.
2.  **Answer Directly from Note:** For all other questions, provide a direct and comprehensive answer based *exclusively* on the provided 'Note Content'. Do not use any external knowledge.
3.  **No Greetings in Answers:** For non-greeting questions, do not start your response with "Hello", "Hi", or any other conversational pleasantry. Get straight to the point.
4.  **No Follow-up Questions:** Do not ask clarifying questions like "What specifically...". Answer the question as best you can with the given information.
5.  **Handle Unanswerable Questions:** If the note content does not contain the answer to a non-greeting question, state: "I cannot answer this question based on the provided note content." and nothing more.
6.  **Use Markdown:** Use markdown for formatting (e.g., lists, bold, italics, code blocks) to improve readability.`;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate streaming response
          const result = await model.generateContentStream(prompt);
          
          let fullResponse = '';
          
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            
            // Send chunk to client
            const data = JSON.stringify({ 
              type: 'chunk', 
              content: chunkText 
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Save the full conversation to the database
          try {
            const updateResult = await Note.findOneAndUpdate(
              { _id: noteId, userId: session.user.id },
              {
                $push: {
                  aiConversations: {
                    question: question.trim(),
                    answer: fullResponse.trim(),
                    timestamp: new Date(),
                  },
                },
              }
            );
            
            if (updateResult) {
              console.log('Conversation saved successfully for note:', noteId);
            } else {
              console.error('Failed to find note to save conversation for noteId:', noteId, 'and userId:', session.user.id);
            }
          } catch (dbError) {
            console.error('Failed to save conversation to DB:', dbError);
            // We don't need to inform the client, just log the error
          }

          // Send completion signal
          const completionData = JSON.stringify({ 
            type: 'complete', 
            content: fullResponse 
          });
          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
          
          controller.close();
        } catch (error) {
          console.error('Error generating AI response:', error);
          
          const errorData = JSON.stringify({ 
            type: 'error', 
            content: 'Sorry, I encountered an error while processing your question. Please try again.' 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 