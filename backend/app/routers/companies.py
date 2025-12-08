from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.database import get_database
from app.core.auth import get_password_hash, create_access_token, get_current_active_user
from app.models.company import (
    CompanyCreate, CompanyUpdate, CompanyResponse,
    EmployeeInvite, EmployeeInviteResponse,
    ColleagueLinkRequest, AdminLinkRequest
)
from app.models.user import UserResponse, UserRole
from app.services.email import send_employee_invite_email, send_colleague_link_email, send_admin_link_email
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["companies"])

def generate_invite_token() -> str:
    """Generate a secure invite token"""
    return secrets.token_urlsafe(32)

def is_company_admin(user: UserResponse) -> bool:
    """Check if user is a company admin"""
    return user.role == UserRole.COMPANY_ADMIN

def is_super_admin(user: UserResponse) -> bool:
    """Check if user is a super admin"""
    return user.role == UserRole.SUPER_ADMIN

class CompanyListItem(BaseModel):
    """Simple company info for public listing"""
    id: str
    name: str
    industry: str | None = None


@router.get("/public/list", response_model=list[CompanyListItem])
async def get_public_companies():
    """
    Get list of all active companies for public registration.
    This endpoint is public and doesn't require authentication.
    """
    db = get_database()
    
    companies = await db.companies.find(
        {"is_active": True},
        {"_id": 1, "name": 1, "industry": 1}
    ).sort("name", 1).to_list(length=1000)
    
    # Convert _id to id for frontend compatibility
    result = []
    for company in companies:
        result.append(CompanyListItem(
            id=str(company["_id"]),
            name=company["name"],
            industry=company.get("industry")
        ))
    
    return result


@router.post("/register", response_model=dict)
async def register_company(company_data: CompanyCreate):
    """
    Register a new company account with an admin user.
    This creates both the company and the admin user account.
    """
    db = get_database()
    
    # Check if company name already exists
    existing_company = await db.companies.find_one({"name": company_data.name})
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name already registered"
        )
    
    # Check if admin email already exists
    existing_user = await db.users.find_one({"email": company_data.admin_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin email already registered"
        )
    
    # Generate username from email
    username = company_data.admin_email.split("@")[0]
    counter = 1
    original_username = username
    while await db.users.find_one({"username": username}):
        username = f"{original_username}{counter}"
        counter += 1
    
    # Create company document
    company_doc = {
        "_id": str(ObjectId()),
        "name": company_data.name,
        "business_model": company_data.business_model.value,
        "industry": company_data.industry.value if company_data.industry else None,
        "website": company_data.website,
        "phone": company_data.phone,
        "address": company_data.address,
        "country": company_data.country,
        "tax_id": company_data.tax_id,
        "admin_user_id": None,  # Will be set after user creation
        "employee_count": 0,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert company first
    await db.companies.insert_one(company_doc)
    company_id = company_doc["_id"]
    
    # Create admin user document
    admin_user_doc = {
        "_id": str(ObjectId()),
        "email": company_data.admin_email,
        "username": username,
        "first_name": company_data.admin_first_name,
        "last_name": company_data.admin_last_name,
        "company_name": company_data.name,  # Legacy field
        "company_id": company_id,
        "industry": company_data.industry.value if company_data.industry else None,
        "hashed_password": get_password_hash(company_data.admin_password),
        "role": UserRole.COMPANY_ADMIN.value,
        "is_active": True,
        "is_verified": False,
        "gdpr_consent": False,
        "terms_accepted": False,
        "tone": "professional",
        "language": "en",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(admin_user_doc)
    
    # Update company with admin user ID
    await db.companies.update_one(
        {"_id": company_id},
        {"$set": {"admin_user_id": admin_user_doc["_id"]}}
    )
    
    # Update local company_doc with admin_user_id for response
    company_doc["admin_user_id"] = admin_user_doc["_id"]
    
    # Create access token for admin
    access_token = create_access_token(data={"sub": admin_user_doc["_id"]})
    
    # Return response
    user_response = UserResponse(**admin_user_doc)
    company_response = CompanyResponse(**company_doc)
    
    logger.info(f"Company registered: {company_data.name} with admin: {company_data.admin_email}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response,
        "company": company_response
    }

@router.post("/{company_id}/invite-employee", response_model=EmployeeInviteResponse)
async def invite_employee(
    company_id: str,
    invite_data: EmployeeInvite,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Invite an employee to join the company.
    Only company admins can invite employees.
    """
    db = get_database()
    
    # Verify user is company admin and belongs to this company
    if current_user.role != UserRole.COMPANY_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company admins can invite employees"
        )
    
    if current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only invite employees to your own company"
        )
    
    # Verify company exists
    company = await db.companies.find_one({"_id": company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": invite_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Generate invite token
    invite_token = generate_invite_token()
    expires_at = datetime.utcnow() + timedelta(days=7)  # Invite expires in 7 days
    
    # Create invite document
    invite_doc = {
        "_id": str(ObjectId()),
        "company_id": company_id,
        "email": invite_data.email,
        "first_name": invite_data.first_name,
        "last_name": invite_data.last_name,
        "role": invite_data.role,
        "invite_token": invite_token,
        "invited_by": current_user.id,
        "expires_at": expires_at,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.invites.insert_one(invite_doc)
    
    # Send invite email if requested
    if invite_data.send_invite_email:
        await send_employee_invite_email(
            email=invite_data.email,
            first_name=invite_data.first_name,
            company_name=company["name"],
            invite_token=invite_token
        )
    
    return EmployeeInviteResponse(
        invite_id=invite_doc["_id"],
        email=invite_data.email,
        invite_token=invite_token,
        expires_at=expires_at,
        message="Employee invite sent successfully"
    )

class AcceptInviteRequest(BaseModel):
    password: str = Field(..., min_length=8)

@router.post("/accept-invite/{invite_token}")
async def accept_employee_invite(
    invite_token: str,
    request: AcceptInviteRequest
):
    """
    Accept an employee invite and create the user account.
    """
    db = get_database()
    
    # Find valid invite
    invite = await db.invites.find_one({
        "invite_token": invite_token,
        "status": "pending",
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invite token"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": invite["email"]})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Get company info
    company = await db.companies.find_one({"_id": invite["company_id"]})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Generate username
    username = invite["email"].split("@")[0]
    counter = 1
    original_username = username
    while await db.users.find_one({"username": username}):
        username = f"{original_username}{counter}"
        counter += 1
    
    # Create user document
    user_doc = {
        "_id": str(ObjectId()),
        "email": invite["email"],
        "username": username,
        "first_name": invite["first_name"],
        "last_name": invite["last_name"],
        "company_name": company["name"],  # Legacy field
        "company_id": invite["company_id"],
        "industry": company.get("industry"),
        "hashed_password": get_password_hash(request.password),
        "role": invite["role"],
        "is_active": True,
        "is_verified": False,
        "gdpr_consent": False,
        "terms_accepted": False,
        "tone": "professional",
        "language": "en",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Update invite status
    await db.invites.update_one(
        {"_id": invite["_id"]},
        {"$set": {"status": "accepted", "accepted_at": datetime.utcnow()}}
    )
    
    # Update company employee count
    await db.companies.update_one(
        {"_id": invite["company_id"]},
        {"$inc": {"employee_count": 1}}
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": user_doc["_id"]})
    user_response = UserResponse(**user_doc)
    
    logger.info(f"Employee invite accepted: {invite['email']} for company: {company['name']}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/link-colleague", response_model=dict)
async def link_colleague_account(
    link_request: ColleagueLinkRequest,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Link a colleague account to the current user's company.
    This allows existing users to join a company as colleagues.
    """
    db = get_database()
    
    # User must belong to a company
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must belong to a company to link colleagues"
        )
    
    # Find the colleague user
    colleague_user = await db.users.find_one({"email": link_request.email})
    if not colleague_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found"
        )
    
    # Check if colleague already belongs to a company
    if colleague_user.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a company"
        )
    
    # Get company info
    company = await db.companies.find_one({"_id": current_user.company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Generate link token
    link_token = generate_invite_token()
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Create link request document
    link_doc = {
        "_id": str(ObjectId()),
        "company_id": current_user.company_id,
        "colleague_email": link_request.email,
        "requested_by": current_user.id,
        "link_token": link_token,
        "expires_at": expires_at,
        "status": "pending",
        "message": link_request.message,
        "created_at": datetime.utcnow()
    }
    
    await db.colleague_links.insert_one(link_doc)
    
    # Send link email
    await send_colleague_link_email(
        email=link_request.email,
        first_name=colleague_user.get("first_name", "User"),
        company_name=company["name"],
        requested_by_name=f"{current_user.first_name} {current_user.last_name}",
        link_token=link_token,
        message=link_request.message
    )
    
    return {
        "message": "Colleague link request sent successfully",
        "link_token": link_token,
        "expires_at": expires_at
    }

@router.post("/accept-colleague-link/{link_token}")
async def accept_colleague_link(link_token: str):
    """
    Accept a colleague link request and join the company.
    """
    db = get_database()
    
    # Find valid link request
    link_request = await db.colleague_links.find_one({
        "link_token": link_token,
        "status": "pending",
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not link_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired link token"
        )
    
    # Find colleague user
    colleague_user = await db.users.find_one({"email": link_request["colleague_email"]})
    if not colleague_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get company info
    company = await db.companies.find_one({"_id": link_request["company_id"]})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update user to join company
    await db.users.update_one(
        {"_id": colleague_user["_id"]},
        {
            "$set": {
                "company_id": link_request["company_id"],
                "company_name": company["name"],  # Legacy field
                "role": UserRole.COLLEAGUE.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update link request status
    await db.colleague_links.update_one(
        {"_id": link_request["_id"]},
        {"$set": {"status": "accepted", "accepted_at": datetime.utcnow()}}
    )
    
    # Update company employee count
    await db.companies.update_one(
        {"_id": link_request["company_id"]},
        {"$inc": {"employee_count": 1}}
    )
    
    logger.info(f"Colleague link accepted: {link_request['colleague_email']} joined company: {company['name']}")
    
    return {
        "message": "Successfully joined company as colleague",
        "company": CompanyResponse(**company)
    }

@router.post("/link-admin", response_model=dict)
async def link_admin_account(
    link_request: AdminLinkRequest,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Link an admin account to a company.
    Only super admins can link other admins to companies.
    """
    db = get_database()
    
    # Only super admins can link admin accounts
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can link admin accounts"
        )
    
    # Verify company exists
    company = await db.companies.find_one({"_id": link_request.company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Find the admin user
    admin_user = await db.users.find_one({"email": link_request.email})
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found"
        )
    
    # Check if user already belongs to a company
    if admin_user.get("company_id") and admin_user["company_id"] != link_request.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to another company"
        )
    
    # Update user to be company admin
    await db.users.update_one(
        {"_id": admin_user["_id"]},
        {
            "$set": {
                "company_id": link_request.company_id,
                "company_name": company["name"],  # Legacy field
                "role": UserRole.COMPANY_ADMIN.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update company admin if not set
    if not company.get("admin_user_id"):
        await db.companies.update_one(
            {"_id": link_request.company_id},
            {"$set": {"admin_user_id": admin_user["_id"]}}
        )
    
    # Send notification email
    await send_admin_link_email(
        email=link_request.email,
        first_name=admin_user.get("first_name", "User"),
        company_name=company["name"],
        message=link_request.message
    )
    
    logger.info(f"Admin linked: {link_request.email} to company: {company['name']}")
    
    return {
        "message": "Admin account linked successfully",
        "company": CompanyResponse(**company)
    }

@router.get("/me", response_model=CompanyResponse)
async def get_my_company(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get the current user's company information.
    """
    db = get_database()
    
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not belong to a company"
        )
    
    company = await db.companies.find_one({"_id": current_user.company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return CompanyResponse(**company)

@router.get("/{company_id}/employees", response_model=list)
async def get_company_employees(
    company_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get all employees of a company.
    Only company admins can view employees.
    """
    db = get_database()
    
    # Verify user is company admin and belongs to this company
    if current_user.role != UserRole.COMPANY_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company admins can view employees"
        )
    
    if current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view employees of your own company"
        )
    
    # Get all users belonging to this company
    employees = await db.users.find({"company_id": company_id}).to_list(length=1000)
    
    return [UserResponse(**emp) for emp in employees]

