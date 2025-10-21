# LinkedIn Integration for Campaigns

## Overview
This document describes the LinkedIn integration that has been added to the campaign system. The integration allows campaigns to automatically send LinkedIn messages to contacts who have LinkedIn profiles.

## Features Implemented

### 1. LinkedIn Service (`backend/app/services/linkedin_service.py`)
- **LinkedInService class**: Handles all LinkedIn API interactions
- **send_message_to_contact()**: Sends a message to a single LinkedIn profile
- **send_messages_to_contacts()**: Sends messages to multiple LinkedIn profiles
- **test_connection()**: Tests the LinkedIn API connection
- **API Endpoint**: `http://3.106.56.62:8000/linkedin/send`

### 2. Manual Campaign Integration (`backend/app/routers/campaigns.py`)
- Added LinkedIn messaging to manual campaign execution
- Checks if contact has `linkedin_profile` field populated
- Sends LinkedIn message using campaign's `call_script` as message content
- Includes LinkedIn count in campaign summary
- Added test endpoint: `GET /campaigns/test-linkedin`

### 3. Scheduled Campaign Integration (`backend/app/services/scheduler.py`)
- Added LinkedIn messaging to scheduled campaign execution
- Same logic as manual campaigns but runs automatically based on schedule
- Includes LinkedIn count in campaign logs and summary

## How It Works

### Campaign Execution Flow
1. **Contact Processing**: For each contact in the campaign:
   - Check if `linkedin_profile` field is not empty
   - If LinkedIn profile exists, send message using campaign's `call_script`
   - Log success/failure for each LinkedIn message

2. **Message Content**: Uses the campaign's `call_script` field as the LinkedIn message content

3. **API Call Format**:
   ```json
   {
     "profile_urls": ["https://www.linkedin.com/in/quangngx"],
     "message": "Hi, i have a good new , i really want to share with you"
   }
   ```

### Database Requirements
- Contact model already includes `linkedin_profile` field (line 32 in `contact.py`)
- Campaign model includes `call_script` field for message content

## API Endpoints

### New Endpoints
- `GET /campaigns/test-linkedin` - Test LinkedIn API connection

### Updated Endpoints
- `POST /campaigns/{campaign_id}/start` - Now includes LinkedIn messaging in manual campaigns
- Campaign summary now includes `linkedin_messages_sent` count

## Testing

### Test Script
Run the test script to verify LinkedIn integration:
```bash
cd backend
python test_linkedin_integration.py
```

### Manual Testing
1. Create a contact with a LinkedIn profile URL
2. Create a campaign with the contact and a call script
3. Start the campaign manually
4. Check logs for LinkedIn message sending

## Configuration

### LinkedIn API
- **URL**: `http://3.106.56.62:8000/linkedin/send`
- **Method**: POST
- **Content-Type**: application/json
- **Timeout**: 30 seconds for single messages, 60 seconds for multiple messages

### Error Handling
- Comprehensive error logging for failed LinkedIn messages
- Graceful handling of API timeouts and connection errors
- Individual contact failures don't stop the entire campaign

## Logging

### Log Messages
- `🔗 [LINKEDIN]` - LinkedIn service operations
- `✅ [LINKEDIN]` - Successful operations
- `❌ [LINKEDIN]` - Failed operations
- `🔍 [LINKEDIN]` - Debug information

### Campaign Summary
Both manual and scheduled campaigns now include LinkedIn message counts in their summaries:
```json
{
  "summary": {
    "total_contacts": 10,
    "calls_made": 5,
    "whatsapp_messages_sent": 3,
    "telegram_messages_sent": 2,
    "linkedin_messages_sent": 4
  }
}
```

## Integration Points

### Manual Campaigns
- File: `backend/app/routers/campaigns.py`
- Function: `start_campaign()` (lines 345-499)
- LinkedIn messaging added after Telegram messaging

### Scheduled Campaigns
- File: `backend/app/services/scheduler.py`
- Function: `start_campaign()` (lines 285-451)
- LinkedIn messaging added after Telegram messaging

## Future Enhancements

### Potential Improvements
1. **Batch Processing**: Send multiple LinkedIn messages in a single API call
2. **Rate Limiting**: Implement rate limiting for LinkedIn API calls
3. **Message Templates**: Support for different message templates per campaign
4. **LinkedIn Analytics**: Track LinkedIn message delivery and response rates
5. **Profile Validation**: Validate LinkedIn profile URLs before sending messages

## Troubleshooting

### Common Issues
1. **API Connection Failed**: Check if LinkedIn API server is running
2. **Invalid Profile URL**: Ensure LinkedIn profile URLs are properly formatted
3. **Timeout Errors**: LinkedIn API may be slow, consider increasing timeout values
4. **Empty Messages**: Ensure campaign has a valid `call_script`

### Debug Steps
1. Test LinkedIn API connection: `GET /campaigns/test-linkedin`
2. Check campaign logs for LinkedIn-specific error messages
3. Verify contact has valid `linkedin_profile` field
4. Ensure campaign has non-empty `call_script` field
