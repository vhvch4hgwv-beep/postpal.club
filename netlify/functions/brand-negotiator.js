const https = require('https');

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { messages, systemPrompt } = JSON.parse(event.body);

        if (!messages || !Array.isArray(messages)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Messages array required' }) };
        }

        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const requestBody = JSON.stringify({
            model: 'gpt-4o-mini',
            messages: apiMessages,
            temperature: 0.8,
            max_tokens: 2000
        });

        const response = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'api.openai.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
            });
            req.on('error', reject);
            req.write(requestBody);
            req.end();
        });

        if (response.statusCode !== 200) {
            const error = JSON.parse(response.body);
            return { statusCode: response.statusCode, headers, body: JSON.stringify({ error: error.error?.message || 'API error' }) };
        }

        const data = JSON.parse(response.body);
        const assistantMessage = data.choices[0]?.message?.content;

        if (!assistantMessage) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'No response from AI' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ message: assistantMessage }) };

    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
    }
};
