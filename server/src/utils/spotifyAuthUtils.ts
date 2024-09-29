// src/utils/spotifyAuthUtils.ts

import crypto from 'crypto';

/**
 * Generates a code verifier for the PKCE flow.
 * @returns {string} A 64-character hexadecimal code verifier.
 */
export function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('hex'); // 32 bytes = 64 hex characters
}

/**
 * Generates a code challenge based on the code verifier.
 * @param {string} codeVerifier - The code verifier string.
 * @returns {string} The code challenge in base64url format.
 */
export function generateCodeChallenge(codeVerifier: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(codeVerifier);
    const codeChallenge = hash
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return codeChallenge;
}
