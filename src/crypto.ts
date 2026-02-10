/**
 * HMAC validation for Cloudflare Worker
 * Verifies that requests from frontend are legitimately signed
 */

export async function verifyHMAC(payload: any, secret: string): Promise<boolean> {
    if (!payload.signature) {
        return false;
    }

    const signature = payload.signature;
    
    // Create a copy without the signature for verification
    const { signature: _, ...payloadWithoutSignature } = payload;
    const payloadString = JSON.stringify(payloadWithoutSignature);

    // Compute HMAC-SHA256 using SubtleCrypto
    const computedSignature = await computeHmacAsync(secret, payloadString);
    
    // Constant-time comparison to prevent timing attacks
    return constantTimeCompare(signature, computedSignature);
}

/**
 * Compute HMAC-SHA256
 * Works in Cloudflare Workers environment with SubtleCrypto
 */
async function computeHmacAsync(secret: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return bytesToHex(new Uint8Array(signature));
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
}
