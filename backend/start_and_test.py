#!/usr/bin/env python3
"""
Start server and test deals API
"""

import subprocess
import time
import requests
import sys
import os

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting FastAPI server...")
    
    # Start server in background
    process = subprocess.Popen([
        sys.executable, "-m", "uvicorn", "main:app", 
        "--reload", "--host", "0.0.0.0", "--port", "8000"
    ], cwd=os.path.dirname(os.path.abspath(__file__)))
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(5)
    
    return process

def test_api():
    """Test the API endpoints"""
    print("🧪 Testing API endpoints...")
    
    base_url = "http://localhost:8000"
    
    # Test basic endpoints
    endpoints = [
        "/",
        "/health",
        "/api/deals",
        "/api/deals/stats"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\n📡 Testing {endpoint}...")
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            print(f"   Status: {response.status_code}")
            
            if endpoint == "/":
                print(f"   Response: {response.json()}")
            elif endpoint == "/health":
                print(f"   Response: {response.json()}")
            elif endpoint.startswith("/api/deals"):
                if response.status_code == 401:
                    print("   ✅ Endpoint exists (401 Unauthorized - expected)")
                elif response.status_code == 404:
                    print("   ❌ Endpoint not found")
                else:
                    print(f"   Response: {response.text[:100]}...")
                    
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection failed")
        except Exception as e:
            print(f"   ❌ Error: {e}")

def main():
    """Main function"""
    try:
        # Start server
        process = start_server()
        
        # Test API
        test_api()
        
        print("\n✅ Testing completed!")
        print("🔧 Server is running at http://localhost:8000")
        print("📚 API docs available at http://localhost:8000/docs")
        
        # Keep server running
        print("\n⏹️  Press Ctrl+C to stop the server")
        process.wait()
        
    except KeyboardInterrupt:
        print("\n🛑 Stopping server...")
        if 'process' in locals():
            process.terminate()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()










