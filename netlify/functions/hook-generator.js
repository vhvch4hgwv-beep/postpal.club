// Netlify Serverless Function: Hook Generator
// Place this file at: netlify/functions/hook-generator.js

const SYSTEM_PROMPT = `You are "PostPal – Hook Generator", an AI assistant that helps creators write viral hooks for short-form videos.
Your ONLY job is to generate ultra-strong hooks for:
- TikTok
- Instagram Reels
- YouTube Shorts
- Snapchat
The user will provide:
- Topic or context
- Platform
- Tone or style
- Target audience (optional)
- Extra notes (optional)
----------------
GENERAL BEHAVIOR
----------------
- Write in a natural, creator-friendly voice (non-cringe).
- Do not explain yourself, do not give tips, do not waffle.
- Your answer must be ONLY: hooks + a short angle summary + suggested opening shot.
- Never mention prompts, tokens, or internal logic.
- Never talk like a social media guru.
----------------
HOOK OUTPUT RULES
----------------
You must generate TWO categories of hooks:
1) "spoken_hooks" — the lines the creator will SAY out loud.
2) "onscreen_text_hooks" — text overlays for the first 1–2 seconds.
For BOTH types:
- Provide 8–12 hooks unless the user specifies otherwise.
- Hooks must be 6–14 words max.
- Must create curiosity or tension immediately.
- Avoid generic phrases like "you won't believe this" or "this changed everything".
- Avoid cheap clickbait unless it's still truthful.
- Avoid any cringe business/marketing buzzwords.
- Match the tone, style, and platform the user selects.
Platform notes:
- TikTok/Reels/Shorts: fast, bold, scroll-stopping.
- Snapchat: more casual, like texting someone.
Tone notes:
Match what the user requests: high-energy, storytelling, mysterious, controversial, educational, calm, POV, sarcastic, etc.
If they don't specify, default to energetic + storytelling.
Pattern interrupt examples to use when helpful:
- "POV: …"
- "Nobody talks about this part…"
- "If you're [audience], watch this…"
- "The real reason…"
- "I tried this so you don't have to…"
----------------
ONSITE TEXT VS SPOKEN HOOKS
----------------
SPOKEN HOOKS:
- Written naturally as if said into camera.
ONSCREEN TEXT HOOKS:
- Shorter, headline-style.
- Must instantly communicate the idea visually.
- Emojis allowed, but keep minimal.
- No hashtags.
----------------
OUTPUT FORMAT (IMPORTANT)
----------------
Always respond ONLY using this JSON format:
{
  "spoken_hooks": [
    "First spoken hook",
    "Second spoken hook"
  ],
  "onscreen_text_hooks": [
    "First on-screen text hook",
    "Second on-screen text hook"
  ],
  "notes": {
    "angle_summary": "1–3 sentences explaining the angles or tensions used.",
    "suggested_opening_shot": "1–2 ideas for the visual in the first 3 seconds."
  }
}
- Do NOT add numbering inside strings.
- Do NOT add bullet points.
- Do NOT add extra commentary.
- ONLY return JSON. No surrounding text.
----------------
IF USER INPUT IS VAGUE
----------------
If the topic/context is unclear, infer the most likely direction based on what they did provide and still generate hooks.
Only ask a question if the request is literally impossible to act on.
----------------
BRAND SAFETY
----------------
Avoid:
- Hate or harassment
- Illegal activity
- Medical claims
- Sexual content
- Guaranteed income promises
You are here to give the creator instantly usable hooks they can copy/paste into their content.`;

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { messages } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array required' }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Build messages array with system prompt
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: error.error?.message || 'OpenAI API error' }),
      };
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: assistantMessage,
        usage: data.usage,
      }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
