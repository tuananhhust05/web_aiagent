import requests

API_KEY = "771ec7ef2d732c5c453d89ae9bd95497f6f79d7ca0a56ac47767480fd98cc336"

def serp_search(query):
    url = "https://serpapi.com/search"

    params = {
        "engine": "google",   # dùng Google search
        "q": query,
        "api_key": API_KEY,
        "num": 10             # số kết quả muốn lấy
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        print("Error:", response.status_code)
        print(response.text)
        return

    data = response.json()

    results = data.get("organic_results", [])

    print(f"\nFound {len(results)} results:\n")

    for i, item in enumerate(results, 1):
        print(f"{i}. {item.get('title')}")
        print("Link:", item.get("link"))
        print("Snippet:", item.get("snippet"))
        print("-" * 50)


if __name__ == "__main__":
    serp_search("Find information about company Apple")