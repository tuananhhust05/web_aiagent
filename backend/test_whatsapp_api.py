#!/usr/bin/env python3
"""
Test script for WhatsApp API endpoint
"""
import asyncio
import aiohttp
import json

async def test_whatsapp_api():
    """Test the WhatsApp API endpoint"""
    url = "http://3.106.56.62:8000/whatsapp/send"
    payload = {
        "phone_numbers": ["+84 33 917 0155"],
        "message": "Test message from AgentVoice"
    }
    
    print(f"🧪 Testing WhatsApp API: {url}")
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

async def test_health_endpoint():
    """Test if there's a health endpoint"""
    health_url = "http://3.106.56.62:8000/whatsapp/health"
    print(f"\n🏥 Testing health endpoint: {health_url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                health_url,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                print(f"📊 Health Status: {response.status}")
                response_text = await response.text()
                print(f"📄 Health Response: {response_text}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")

async def test_root_endpoint():
    """Test the root endpoint to see what's available"""
    root_url = "http://3.106.56.62:8000/"
    print(f"\n🌐 Testing root endpoint: {root_url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                root_url,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                print(f"📊 Root Status: {response.status}")
                response_text = await response.text()
                print(f"📄 Root Response: {response_text[:500]}...")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")

if __name__ == "__main__":
    print("🚀 Starting WhatsApp API tests...\n")
    asyncio.run(test_whatsapp_api())
    asyncio.run(test_health_endpoint())
    asyncio.run(test_root_endpoint())
    print("\n✅ Tests completed!")









