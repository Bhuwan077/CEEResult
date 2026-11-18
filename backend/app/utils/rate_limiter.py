"""
Sliding-Window Rate Limiter for Nepal CEE Result Checker.
Protects public search endpoints against high-concurrency brute forcing and DoS.
"""

import time
from typing import Dict, List
from fastapi import Request, HTTPException, status


class SlidingWindowRateLimiter:
    """
    In-memory rate limiter tracking timestamps of requests per client IP.
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self.history: Dict[str, List[float]] = {}

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds

        if client_ip not in self.history:
            self.history[client_ip] = [now]
            return True

        # Keep timestamps within the window
        timestamps = [t for t in self.history[client_ip] if t > cutoff]
        if len(timestamps) >= self.requests_per_minute:
            self.history[client_ip] = timestamps
            return False

        timestamps.append(now)
        self.history[client_ip] = timestamps
        return True


rate_limiter = SlidingWindowRateLimiter(requests_per_minute=60)


async def check_search_rate_limit(request: Request):
    """FastAPI Dependency for rate limiting public search."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    # Respect X-Forwarded-For if behind reverse proxy like Render or Vercel
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a minute before checking additional results."
        )
