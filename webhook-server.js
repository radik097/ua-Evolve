/**
 * Local Webhook Server
 * For testing registration submissions during development
 * In production, use GitHub Actions instead
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data', 'registrations');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Registration endpoint
    if (req.pathname === '/api/register' && req.method === 'POST') {
        handleRegistration(req, res);
        return;
    }

    // Stats endpoint
    if (req.url === '/api/stats' && req.method === 'GET') {
        handleStats(res);
        return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.on('request', (req, res) => {
    // Parse URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    req.pathname = url.pathname;
    req.query = Object.fromEntries(url.searchParams);

    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.pathname}`);
});

function handleRegistration(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            
            // Validate required fields
            if (!data.id || !data.name || !data.email) {
                res.writeHead(400);
                res.end(JSON.stringify({ 
                    error: 'Missing required fields' 
                }));
                return;
            }

            // Save to file
            const filename = path.join(DATA_DIR, `${data.id}.json`);
            fs.writeFileSync(filename, JSON.stringify(data, null, 2));

            console.log(`✓ Registration saved: ${data.id}`);

            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                id: data.id,
                message: 'Registration saved'
            }));

        } catch (err) {
            console.error('Error processing registration:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ 
                error: err.message 
            }));
        }
    });
}

function handleStats(res) {
    try {
        const files = fs.readdirSync(DATA_DIR);
        const total = files.filter(f => f.endsWith('.json')).length;

        res.writeHead(200);
        res.end(JSON.stringify({
            totalRegistrations: total,
            lastUpdated: new Date().toISOString(),
            dataDirectory: DATA_DIR
        }));
    } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ 
            error: err.message 
        }));
    }
}

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  Queue App - Webhook Server Running    ║
║  http://localhost:${PORT}                  ║
║                                        ║
║  Endpoints:                            ║
║  POST   /api/register                  ║
║  GET    /api/stats                     ║
║  GET    /health                        ║
╚════════════════════════════════════════╝
    `);
});
