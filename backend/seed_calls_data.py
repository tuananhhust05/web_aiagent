#!/usr/bin/env python3
"""
Script to seed sample calls data for testing the KPI tracking system
"""
import asyncio
import random
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Sample data
SAMPLE_AGENTS = ["Alexa Outbound", "Sarah Inbound", "Mike Sales", "Lisa Support"]
SAMPLE_PHONE_NUMBERS = [
    "+39339859220", "+99334706575", "+39293769462", "+39439573262",
    "+1234567890", "+9876543210", "+5555555555", "+1111111111"
]
SAMPLE_FEEDBACKS = [
    "The agent managed the conversation efficiently and professionally, quickly comprehending the caller's needs and providing clear and relevant information.",
    "Customer was satisfied with the service and agreed to schedule a follow-up meeting.",
    "Call ended abruptly due to technical issues. Customer requested callback.",
    "Excellent customer service. Agent was knowledgeable and helpful.",
    "Customer had concerns about pricing but agent handled objections well.",
    "Call quality was poor, customer had difficulty hearing the agent.",
    "Customer was interested in the product but needed time to think.",
    "Agent was very professional and answered all questions thoroughly."
]

async def seed_calls_data():
    """Seed the database with sample calls data"""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DATABASE]
    
    # Get a sample user ID (assuming there's at least one user)
    user = await db.users.find_one()
    if not user:
        print("No users found in database. Please create a user first.")
        return
    
    user_id = user["_id"]
    print(f"Seeding data for user: {user_id}")
    
    # Clear existing calls for this user
    await db.calls.delete_many({"user_id": user_id})
    print("Cleared existing calls data")
    
    # Generate sample calls for the last 30 days
    calls = []
    base_date = datetime.utcnow() - timedelta(days=30)
    
    for i in range(200):  # Generate 200 sample calls
        call_date = base_date + timedelta(
            days=random.randint(0, 30),
            hours=random.randint(8, 18),
            minutes=random.randint(0, 59)
        )
        
        duration = random.randint(30, 1800)  # 30 seconds to 30 minutes
        agent = random.choice(SAMPLE_AGENTS)
        phone_number = random.choice(SAMPLE_PHONE_NUMBERS)
        call_type = random.choice(["inbound", "outbound"])
        
        # Determine status based on call type and duration
        if call_type == "outbound":
            status = random.choices(
                ["completed", "failed", "busy", "no_answer"],
                weights=[0.6, 0.1, 0.15, 0.15]
            )[0]
        else:
            status = random.choices(
                ["completed", "failed"],
                weights=[0.8, 0.2]
            )[0]
        
        # Generate sentiment data for completed calls
        sentiment = None
        sentiment_score = None
        feedback = None
        meeting_booked = False
        
        if status == "completed":
            sentiment = random.choice(["positive", "negative", "neutral"])
            sentiment_score = random.uniform(0.3, 0.95)
            feedback = random.choice(SAMPLE_FEEDBACKS)
            meeting_booked = random.choice([True, False]) if sentiment == "positive" else False
        
        call = {
            "_id": f"call_{i:04d}",
            "user_id": user_id,
            "phone_number": phone_number,
            "agent_name": agent,
            "call_type": call_type,
            "duration": duration,
            "status": status,
            "sentiment": sentiment,
            "sentiment_score": sentiment_score,
            "feedback": feedback,
            "meeting_booked": meeting_booked,
            "meeting_date": call_date + timedelta(days=random.randint(1, 7)) if meeting_booked else None,
            "recording_url": f"https://recordings.example.com/call_{i:04d}.mp3" if status == "completed" else None,
            "transcript": f"Sample transcript for call {i:04d}..." if status == "completed" else None,
            "notes": f"Sample notes for call {i:04d}" if status == "completed" else None,
            "created_at": call_date,
            "updated_at": call_date
        }
        
        calls.append(call)
    
    # Insert all calls
    if calls:
        await db.calls.insert_many(calls)
        print(f"Inserted {len(calls)} sample calls")
    
    # Print summary
    total_calls = await db.calls.count_documents({"user_id": user_id})
    completed_calls = await db.calls.count_documents({"user_id": user_id, "status": "completed"})
    meetings_booked = await db.calls.count_documents({"user_id": user_id, "meeting_booked": True})
    
    print(f"\nSummary:")
    print(f"Total calls: {total_calls}")
    print(f"Completed calls: {completed_calls}")
    print(f"Meetings booked: {meetings_booked}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_calls_data())
