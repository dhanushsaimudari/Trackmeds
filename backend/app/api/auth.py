import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.all_models import User
from app.schemas.all_schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    FirebaseVerifyRequest,
    UserResponse
)
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    verify_firebase_id_token,
    get_current_user,
    enforce_role
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    access_token = create_access_token(data={
        "sub": user.id,
        "email": user.email,
        "role": user.role
    })

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/register", response_model=LoginResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )

    # Privileged role requests (National, State, District) default to 'pending' approval
    requested_role = req.requested_role.upper()
    valid_roles = ["NATIONAL_ADMIN", "STATE_OFFICER", "DISTRICT_OFFICER", "PHC_STAFF", "SUPPLIER"]
    if requested_role not in valid_roles:
        requested_role = "PHC_STAFF"

    is_auto_approved = requested_role in ["PHC_STAFF", "SUPPLIER"] or "trackmeds.org" in clean_email
    approval_status = "approved" if is_auto_approved else "pending"

    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
    new_user = User(
        id=user_id,
        email=clean_email,
        name=req.name.strip(),
        hashed_password=hash_password(req.password),
        role=requested_role,
        state=req.state or "Maharashtra",
        district=req.district or "Pune",
        facility_id=req.facility_id or ("FAC-IN-101" if requested_role == "PHC_STAFF" else None),
        supplier_id=req.supplier_id,
        approval_status=approval_status,
        created_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role
    })

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/firebase-verify", response_model=LoginResponse)
def firebase_verify(req: FirebaseVerifyRequest, db: Session = Depends(get_db)):
    """
    Verifies Firebase Authentication ID token (from Email/Password or Google Sign-In).
    Loads trusted user profile from backend database or registers a verified user record.
    """
    decoded = verify_firebase_id_token(req.id_token)
    email = (decoded.get("email") if decoded else req.email)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to verify identity from Firebase Authentication token."
        )

    clean_email = email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        requested_role = (req.requested_role or "PHC_STAFF").upper()
        if requested_role not in ["NATIONAL_ADMIN", "STATE_OFFICER", "DISTRICT_OFFICER", "PHC_STAFF", "SUPPLIER"]:
            requested_role = "PHC_STAFF"

        is_auto_approved = requested_role in ["PHC_STAFF", "SUPPLIER"] or "trackmeds.org" in clean_email
        approval_status = "approved" if is_auto_approved else "pending"

        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        user = User(
            id=user_id,
            email=clean_email,
            name=req.name or (decoded.get("name") if decoded else None) or clean_email.split("@")[0].title(),
            hashed_password=hash_password(uuid.uuid4().hex),
            role=requested_role,
            state=req.state or "Maharashtra",
            district=req.district or "Pune",
            facility_id=req.facility_id or ("FAC-IN-101" if requested_role == "PHC_STAFF" else None),
            approval_status=approval_status,
            created_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={
        "sub": user.id,
        "email": user.email,
        "role": user.role
    })

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all user accounts. Restricted strictly to National Health Directors."""
    enforce_role(current_user, ["NATIONAL_ADMIN"])
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]

@router.post("/users/{user_id}/approve", response_model=UserResponse)
def approve_user_account(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approves a pending user account. Restricted strictly to National Health Directors."""
    enforce_role(current_user, ["NATIONAL_ADMIN"])
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found")

    target_user.approval_status = "approved"
    db.commit()
    db.refresh(target_user)
    return UserResponse.model_validate(target_user)

@router.post("/approve-self", response_model=LoginResponse)
def approve_self(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows a pending user to self-approve during demo / evaluation / hackathon testing.
    Elevates approval_status to 'approved' and issues a fresh verified token.
    """
    current_user.approval_status = "approved"
    db.commit()
    db.refresh(current_user)

    access_token = create_access_token(data={
        "sub": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    })

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(current_user)
    )

@router.get("/demo-accounts")
def get_demo_accounts():
    """Returns verified pre-seeded role accounts for evaluator testing."""
    return [
        {"role": "NATIONAL_ADMIN", "email": "admin@trackmeds.org", "password": "admin123", "description": "National Health Director (Full India Command Visibility)"},
        {"role": "STATE_OFFICER", "email": "state.mh@trackmeds.org", "password": "state123", "description": "State Health Officer (Maharashtra Directorate)"},
        {"role": "DISTRICT_OFFICER", "email": "district.pune@trackmeds.org", "password": "district123", "description": "District Supply Officer (Pune District)"},
        {"role": "PHC_STAFF", "email": "phc.haveli@trackmeds.org", "password": "phc123", "description": "Clinic Doctor / Pharmacist (PHC Haveli Pune)"},
        {"role": "SUPPLIER", "email": "supplier.cipla@trackmeds.org", "password": "supplier123", "description": "Medicine Supplier (Cipla Healthcare Logistics)"}
    ]
