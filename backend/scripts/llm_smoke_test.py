import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services.llm_engine import chat_json, chat_text


async def main() -> None:
    text = await chat_text(prompt="Reply with exactly: ok", max_tokens=10)
    print(text)

    obj = await chat_json(prompt='Return JSON: {"ok": true}', max_tokens=50)
    print(obj)


if __name__ == "__main__":
    asyncio.run(main())

