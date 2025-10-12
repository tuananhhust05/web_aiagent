import asyncio
import httpx

async def test_whatsapp_proxy():
    """Test the WhatsApp proxy endpoints"""
    
    # Test data
    conversations_payload = {
        "member_id": "8386",
        "page": 1,
        "limit": 10
    }
    
    messages_payload = {
        "conversation_id": 19,
        "page": 1,
        "limit": 20
    }
    
    print("🧪 Testing WhatsApp Proxy Endpoints...")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test conversations endpoint
            print("\n1. Testing conversations endpoint...")
            response = await client.post(
                "http://localhost:8000/api/whatsapp/conversations/member",
                json=conversations_payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
            if response.status_code == 200:
                print("✅ Conversations proxy test successful!")
            else:
                print("❌ Conversations proxy test failed!")
            
            # Test messages endpoint
            print("\n2. Testing messages endpoint...")
            response = await client.post(
                "http://localhost:8000/api/whatsapp/conversations/messages",
                json=messages_payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
            if response.status_code == 200:
                print("✅ Messages proxy test successful!")
            else:
                print("❌ Messages proxy test failed!")
                
    except Exception as e:
        print(f"❌ Error testing WhatsApp proxy: {e}")

if __name__ == "__main__":
    asyncio.run(test_whatsapp_proxy())
