import asyncio
import json
import os
from typing import Any, Dict, List, Optional

from openai import OpenAI

from app.core.config import settings


DEFAULT_OPENAI_MODEL = getattr(settings, "OPENAI_MODEL", "") or os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def _get_openai_client() -> OpenAI:
    if not getattr(settings, "OPEN_AI_KEY", None):
        raise RuntimeError("Missing OPEN_AI_KEY")
    return OpenAI(api_key=settings.OPEN_AI_KEY)


def _strip_code_fences(content: str) -> str:
    c = (content or "").strip()
    if not c.startswith("```"):
        return c
    lines = c.split("\n")
    if len(lines) <= 2:
        return c.strip("`").strip()
    if lines[-1].strip() == "```":
        return "\n".join(lines[1:-1]).strip()
    return "\n".join(lines[1:]).strip()


def _parse_json_like(content: str) -> Any:
    c = _strip_code_fences(content)
    try:
        return json.loads(c)
    except Exception:
        start = c.find("{")
        end = c.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(c[start : end + 1])
        start = c.find("[")
        end = c.rfind("]")
        if start != -1 and end != -1 and end > start:
            return json.loads(c[start : end + 1])
        raise


def _is_retryable_error(exc: Exception) -> bool:
    status_code = getattr(exc, "status_code", None)
    if status_code in (429, 500, 502, 503, 504):
        return True
    msg = str(exc).lower()
    if "rate limit" in msg or "timeout" in msg or "temporarily unavailable" in msg:
        return True
    return False


async def chat_text(
    prompt: str,
    system: str = "",
    model: str = DEFAULT_OPENAI_MODEL,
    temperature: float = 0.3,
    max_tokens: int = 1500,
    retries: int = 2,
) -> str:
    def _sync_call() -> str:
        client = _get_openai_client()
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return (resp.choices[0].message.content or "").strip()

    backoff_sec = 1.5
    attempts = max(0, retries) + 1
    for attempt in range(attempts):
        try:
            return await asyncio.to_thread(_sync_call)
        except Exception as e:
            if attempt >= attempts - 1 or not _is_retryable_error(e):
                raise
            await asyncio.sleep(backoff_sec)
            backoff_sec = min(backoff_sec * 2, 12.0)
    raise RuntimeError("Unexpected retry loop exit")


async def chat_json(
    prompt: str,
    system: str = "Return ONLY valid JSON. No markdown. No extra text.",
    model: str = DEFAULT_OPENAI_MODEL,
    temperature: float = 0.3,
    max_tokens: int = 4000,
    retries: int = 2,
) -> Any:
    content = await chat_text(
        prompt=prompt,
        system=system,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        retries=retries,
    )
    return _parse_json_like(content)
