import crypto from 'crypto';
export function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('hex');
}
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
