from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from datetime import datetime
from typing import List
import pandas as pd
import io
from bson import ObjectId
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.contact import ContactCreate, ContactResponse, ContactSource, ContactStatus

router = APIRouter()

@router.post("/import-excel", response_model=dict)
async def import_contacts_from_excel(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Import contacts from Excel file"""
    db = get_database()
    
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be Excel (.xlsx, .xls) or CSV (.csv) format"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse Excel/CSV file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Validate required columns
        required_columns = ['First Name', 'Last Name', 'Email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Process contacts
        contacts_to_create = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Map Excel columns to contact fields
                status_value = str(row.get('Status', 'lead')).strip() if pd.notna(row.get('Status')) else 'lead'
                source_value = str(row.get('Source', 'import')).strip() if pd.notna(row.get('Source')) else 'import'
                
                # Validate status and source values
                try:
                    status = ContactStatus(status_value.lower())
                except ValueError:
                    status = ContactStatus.LEAD
                
                try:
                    source = ContactSource(source_value.lower())
                except ValueError:
                    source = ContactSource.IMPORT
                
                contact_data = {
                    "first_name": str(row.get('First Name', '')).strip(),
                    "last_name": str(row.get('Last Name', '')).strip(),
                    "email": str(row.get('Email', '')).strip(),
                    "phone": str(row.get('Phone', '')).strip() if pd.notna(row.get('Phone')) else None,
                    "company": str(row.get('Company', '')).strip() if pd.notna(row.get('Company')) else None,
                    "status": status,
                    "source": source,
                    "notes": str(row.get('Notes', '')).strip() if pd.notna(row.get('Notes')) else None,
                    "user_id": current_user.id,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                # Validate required fields
                if not contact_data["first_name"] or not contact_data["last_name"] or not contact_data["email"]:
                    errors.append(f"Row {index + 2}: Missing required fields (First Name, Last Name, Email)")
                    continue
                
                # Check if email already exists for this user
                existing_contact = await db.contacts.find_one({
                    "email": contact_data["email"],
                    "user_id": current_user.id
                })
                
                if existing_contact:
                    errors.append(f"Row {index + 2}: Email '{contact_data['email']}' already exists")
                    continue
                
                contacts_to_create.append(contact_data)
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                continue
        
        # Create contacts in database
        created_contacts = []
        if contacts_to_create:
            # Add _id to each contact
            for contact in contacts_to_create:
                contact["_id"] = str(ObjectId())
            
            result = await db.contacts.insert_many(contacts_to_create)
            created_contacts = [str(id) for id in result.inserted_ids]
        
        return {
            "message": "Import completed",
            "total_rows": len(df),
            "created_contacts": len(created_contacts),
            "errors": len(errors),
            "error_details": errors[:10],  # Limit to first 10 errors
            "created_contact_ids": created_contacts
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}"
        )

@router.get("/import-template")
async def get_import_template():
    """Get import template structure"""
    return {
        "required_columns": [
            "First Name",
            "Last Name", 
            "Email"
        ],
        "optional_columns": [
            "Phone",
            "Company",
            "Status",
            "Source",
            "Notes"
        ],
        "status_options": [
            "lead",
            "prospect", 
            "customer",
            "active",
            "inactive"
        ],
        "source_options": [
            "manual",
            "csv_import",
            "import",
            "hubspot",
            "salesforce",
            "pipedrive",
            "website",
            "referral",
            "social_media",
            "email_campaign"
        ]
    }
