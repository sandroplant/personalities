# spotify_auth_utils.py

import base64
import os
import hashlib

def generate_code_verifier() -> str:
    """Generate a random code verifier."""
    random_bytes = os.urandom(64)
    code_verifier = base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')
    return code_verifier

def generate_code_challenge(code_verifier: str) -> str:
    """Generate a code challenge from the code verifier."""
    code_verifier_bytes = code_verifier.encode('utf-8')
    sha256_hash = hashlib.sha256(code_verifier_bytes).digest()
    code_challenge = base64.urlsafe_b64encode(sha256_hash).decode('utf-8').rstrip('=')
    return code_challenge
