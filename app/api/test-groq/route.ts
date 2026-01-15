// Test endpoint to verify Groq API is working
import { NextResponse } from 'next/server'

export async function GET() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY
  
  if (!GROQ_API_KEY) {
    return NextResponse.json({ 
      error: 'GROQ_API_KEY not found in environment variables',
      hint: 'Add GROQ_API_KEY to .env.local'
    }, { status: 500 })
  }

  try {
    // Groq API endpoint
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Keep responses short and friendly.'
          },
          {
            role: 'user',
            content: 'Say hello and confirm you are working!'
          }
        ],
        temperature: 0.8,
        max_tokens: 50
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: 'Groq API request failed',
        status: response.status,
        details: errorText
      }, { status: response.status })
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content

    return NextResponse.json({
      success: true,
      message: 'Groq API is working!',
      apiKey: GROQ_API_KEY.substring(0, 10) + '...' + GROQ_API_KEY.substring(GROQ_API_KEY.length - 5),
      response: aiResponse,
      model: 'llama-3.1-8b-instant'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to connect to Groq API',
      message: error.message
    }, { status: 500 })
  }
}

