from openai import OpenAI
import os
import dotenv
dotenv.load_dotenv(override=True)

print("Testing Claude API...")
print("Using API key:", os.environ.get("ANTHROPIC_AUTH_TOKEN"))
print("Using base URL:", os.environ.get("ANTHROPIC_BASE_URL"))
client = OpenAI(
    api_key=os.environ.get("ANTHROPIC_AUTH_TOKEN"),
    base_url=os.environ.get("ANTHROPIC_BASE_URL")
)

response = client.chat.completions.create(
    model="claude-haiku-4.6",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)