import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_TOKEN = ""
ACTOR_ID = "2SyF0bVxmgGr8IVCZ"

url = f"https://api.apify.com/v2/acts/{ACTOR_ID}/run-sync-get-dataset-items?token={API_TOKEN}"

payload = {
    "profileUrls": [
        "https://it.linkedin.com/in/andreamarino1992"
    ]
}

response = requests.post(url, json=payload, timeout=120)

print(response.json())