import asyncio
import httpx

async def test_telegram_proxy():
    """Test the Telegram proxy endpoint"""
    
    # Test data
    test_payload = {
        "urls": [
            "https://web.telegram.org/k/#@binhnt86",
            "https://web.telegram.org/k/#@phamlong2103"
        ],
        "message": "Hi, i have a new product !"
    }
    
    print("🧪 Testing Telegram Proxy Endpoint...")
    print(f"📱 URLs: {test_payload['urls']}")
    print(f"💬 Message: {test_payload['message']}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test proxy endpoint
            print("\n1. Testing proxy endpoint...")
            response = await client.post(
                "http://localhost:8000/api/telegram/proxy-send",
                json=test_payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                print("✅ Proxy endpoint test successful!")
            else:
                print("❌ Proxy endpoint test failed!")
                
    except Exception as e:
        print(f"❌ Error testing proxy: {e}")

if __name__ == "__main__":
    asyncio.run(test_telegram_proxy())
