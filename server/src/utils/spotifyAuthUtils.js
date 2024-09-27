import crypto from 'crypto';

// Function to generate a code verifier
export function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('hex');
}

// Function to generate a code challenge
export function generateCodeChallenge(codeVerifier) {
    const hash = crypto.createHash('sha256');
    hash.update(codeVerifier);
    const codeChallenge = hash
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return codeChallenge;
}
//     } else {
