var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/crypto.ts
function verifyHMAC(payload, secret) {
  if (!payload.signature) {
    return false;
  }
  const signature = payload.signature;
  const { signature: _, ...payloadWithoutSignature } = payload;
  const payloadString = JSON.stringify(payloadWithoutSignature);
  const computedSignature = computeHmac(secret, payloadString);
  return constantTimeCompare(signature, computedSignature);
}
__name(verifyHMAC, "verifyHMAC");
function computeHmac(secret, message) {
  const key = secret;
  const msg = message;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      return sha256hmac(key, msg);
    }
  } catch (e) {
    console.error("Crypto error:", e);
  }
  return sha256hmac(key, msg);
}
__name(computeHmac, "computeHmac");
function sha256hmac(key, message) {
  const blockSize = 64;
  const outputSize = 32;
  let keyBytes = new TextEncoder().encode(key);
  if (keyBytes.length > blockSize) {
    keyBytes = new Uint8Array(32);
  }
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    const keyByte = i < keyBytes.length ? keyBytes[i] : 0;
    ipad[i] = keyByte ^ 54;
    opad[i] = keyByte ^ 92;
  }
  return "";
}
__name(sha256hmac, "sha256hmac");
function constantTimeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
__name(constantTimeCompare, "constantTimeCompare");

// src/index.ts
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Signature, X-Timestamp",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    if (url.pathname === "/api/github" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!verifyHMAC(body, env.APP_SECRET)) {
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
        const now = Date.now();
        if (Math.abs(now - body.timestamp) > 6e4) {
          return new Response(JSON.stringify({ error: "Timestamp expired" }), {
            status: 401,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
        const githubResponse = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
          method: "POST",
          headers: {
            "Authorization": `token ${env.GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            event_type: body.type,
            client_payload: {
              ...body.data,
              submitted_at: new Date(body.timestamp).toISOString()
            }
          })
        });
        if (!githubResponse.ok) {
          const errorText = await githubResponse.text();
          console.error(`GitHub API error: ${githubResponse.status}`, errorText);
          throw new Error(`GitHub API error: ${githubResponse.status}`);
        }
        return new Response(JSON.stringify({ success: true, message: "Event sent to GitHub" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (error) {
        console.error("Worker error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
