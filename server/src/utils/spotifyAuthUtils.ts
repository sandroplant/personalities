// src/utils/spotifyAuthUtils.ts

import crypto from 'crypto';

/**
 * Generates a secure code verifier for the PKCE (Proof Key for Code Exchange) flow.
 * The code verifier is a random 64-character string used to securely authenticate.
 * @returns {string} A 64-character hexadecimal code verifier.
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('hex'); // 32 bytes generate a 64-character hex string
}

/**
 * Generates a code challenge by hashing the code verifier using SHA-256.
 * The result is then encoded in base64url format to ensure compatibility.
 * @param {string} codeVerifier - The code verifier to be hashed.
 * @returns {string} The resulting code challenge in base64url format.
 */
export function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(codeVerifier);

  const codeChallenge = hash
    .digest('base64')
    .replace(/\+/g, '-') // Replace + with -
    .replace(/\//g, '_') // Replace / with _
    .replace(/=+$/, ''); // Remove any trailing '=' characters (base64 padding)

  return codeChallenge;
}
