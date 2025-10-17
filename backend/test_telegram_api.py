#!/usr/bin/env python3
"""
Test script for Telegram API endpoint
"""
import asyncio
import aiohttp
import json

async def test_telegram_api():
    """Test the Telegram API endpoint"""
    url = "http://3.106.56.62:8000/telegram/send"
    payload = {
        "urls": ["https://web.telegram.org/k/#@binhnt86"],
        "message": "Hi, i have a new product !"
    }
    
    print(f"🧪 Testing Telegram API: {url}")
    print(f"📝 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                print(f"📊 Status Code: {response.status}")
                print(f"📋 Headers: {dict(response.headers)}")
                
                # Check content type
                content_type = response.headers.get('content-type', '')
                print(f"📄 Content-Type: {content_type}")
                
                if 'application/json' in content_type:
                    try:
                        response_data = await response.json()
                        print(f"✅ JSON Response: {json.dumps(response_data, indent=2)}")
                    except Exception as e:
                        print(f"❌ Failed to parse JSON: {e}")
                        response_text = await response.text()
                        print(f"📄 Raw Response: {response_text}")
                else:
                    response_text = await response.text()
                    print(f"📄 Non-JSON Response: {response_text}")
                    
    except aiohttp.ClientError as e:
        print(f"❌ Connection Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

async def test_telegram_service():
    """Test our Telegram service"""
    from app.services.telegram_service import telegram_service
    
    print(f"\n🔧 Testing Telegram Service...")
    
    # Test URL building
    test_username = "binhnt86"
    telegram_url = telegram_service.build_telegram_url(test_username)
    print(f"🔗 Built URL: {telegram_url}")
    
    # Test sending message
    try:
        result = await telegram_service.send_message_to_contact(
            test_username, 
            "Test message from AgentVoice"
        )
        print(f"📤 Send result: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"❌ Service test error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Telegram API tests...\n")
    asyncio.run(test_telegram_api())
    asyncio.run(test_telegram_service())
    print("\n✅ Tests completed!")