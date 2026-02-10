import { verifyHMAC } from './crypto';

interface EventPayload {
    type: 'register' | 'audit' | 'delete';
    data: any;
    timestamp: number;
    signature: string;
}

export default {
    async fetch(request: Request, env: any) {
        const url = new URL(request.url);

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-Signature, X-Timestamp',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        // Route: /api/github
        if (url.pathname === '/api/github' && request.method === 'POST') {
            try {
                const body: EventPayload = await request.json();
        
                // 1. Validate HMAC signature
                if (!verifyHMAC(body, env.APP_SECRET)) {
                    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    });
                }

                // 2. Validate timestamp (60 second window)
                const now = Date.now();
                if (Math.abs(now - body.timestamp) > 60000) {
                    return new Response(JSON.stringify({ error: 'Timestamp expired' }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    });
                }

                // 3. Send to GitHub API (repository_dispatch)
                const githubResponse = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        event_type: body.type,
                        client_payload: {
                            ...body.data,
                            submitted_at: new Date(body.timestamp).toISOString(),
                        },
                    }),
                });

                if (!githubResponse.ok) {
                    const errorText = await githubResponse.text();
                    console.error(`GitHub API error: ${githubResponse.status}`, errorText);
                    throw new Error(`GitHub API error: ${githubResponse.status}`);
                }

                return new Response(JSON.stringify({ success: true, message: 'Event sent to GitHub' }), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });

            } catch (error: any) {
                console.error('Worker error:', error);
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
        }

        // Health check
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'ok' }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    },
};
