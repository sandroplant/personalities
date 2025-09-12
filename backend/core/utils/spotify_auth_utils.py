# core/utils/spotify_auth_utils.py

import os
import base64
import hashlib
import secrets


def generate_code_verifier(length: int = 64) -> str:
    """
    Generates a secure code verifier for the PKCE (Proof Key for Code Exchange) flow.
    The code verifier is a high-entropy cryptographic random string using the unreserved characters.

    Args:
        length (int): The length of the code verifier. Defaults to 64 characters.

    Returns:
        str: A URL-safe, high-entropy code verifier string.
    """
    # Generate a URL-safe base64-encoded string without padding
    code_verifier = base64.urlsafe_b64encode(os.urandom(48)).decode("utf-8").rstrip("=")
    return code_verifier


def generate_code_challenge(code_verifier: str) -> str:
    """
    Generates a code challenge by hashing the code verifier using SHA-256.
    The result is then encoded in base64url format to ensure compatibility.

    Args:
        code_verifier (str): The code verifier to be hashed.

    Returns:
        str: The resulting code challenge in base64url format.
    """
    sha256_hash = hashlib.sha256(code_verifier.encode("utf-8")).digest()
    code_challenge = base64.urlsafe_b64encode(sha256_hash).decode("utf-8").rstrip("=")
    return code_challenge


def generate_state(length: int = 16) -> str:
    """
    Generates a secure random string to be used as the state parameter in OAuth flows.

    Args:
        length (int): The length of the state string. Defaults to 16 characters.

    Returns:
        str: A secure random state string.
    """
    return secrets.token_urlsafe(length)
