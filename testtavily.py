import requests

API_KEY = ""

url = "https://api.tavily.com/search"

payload = {
    "query": "linkedn andrea.marino@forskale.com",
    "search_depth": "basic",
    "max_results": 5,
    "include_answer": True
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

response = requests.post(url, json=payload, headers=headers)

print(response.json())