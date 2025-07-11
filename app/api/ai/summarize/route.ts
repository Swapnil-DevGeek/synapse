import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';
import { authOptions } from '../../auth/[...nextauth]/route';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { noteId, noteContent } = await request.json();

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
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

    const contentToSummarize = noteContent || note.content;
    
    if (!contentToSummarize || contentToSummarize.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is empty - nothing to summarize' },
        { status: 400 }
      );
    }

    // Prepare the prompt for Gemini
    const prompt = `Please provide a concise and comprehensive summary of the following note:

Title: ${note.title}
Content: ${contentToSummarize}

Create a well-structured summary that:
1. Captures the main ideas and key points
2. Maintains the logical flow of the original content
3. Is significantly shorter than the original while preserving essential information
4. Uses clear, professional language
5. Highlights any important conclusions or takeaways

Summary:`;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate streaming response
          const result = await model.generateContentStream(prompt);
          
          let fullSummary = '';
          
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullSummary += chunkText;
            
            // Send chunk to client
            const data = JSON.stringify({ 
              type: 'chunk', 
              content: chunkText 
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send completion signal
          const completionData = JSON.stringify({ 
            type: 'complete', 
            content: fullSummary 
          });
          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
          
          controller.close();
        } catch (error) {
          console.error('Error generating AI summary:', error);
          
          const errorData = JSON.stringify({ 
            type: 'error', 
            content: 'Sorry, I encountered an error while generating the summary. Please try again.' 
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
    console.error('AI Summarize API Error:', error);
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