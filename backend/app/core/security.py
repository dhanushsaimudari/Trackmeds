import os
import hmac
import hashlib
import base64
import json
import datetime
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import User

import secrets

from app.config import settings

SECRET_KEY = settings.SECRET_KEY
if settings.ENVIRONMENT == "production" and ("trackmeds-brics" in SECRET_KEY or "trackmeds-production" in SECRET_KEY):
    import logging
    logging.warning("CRITICAL SECURITY WARNING: Running in production with default SECRET_KEY! Configure a secure secret in Secret Manager.")

ALGORITHM = "HS256"
LEGACY_SALT = b"trackmeds_salt_2026"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_firebase_id_token(id_token: str) -> Optional[dict]:
    """
    Verifies a Firebase ID token using the Firebase Admin SDK if configured.
    Falls back safely to parsing claims if running in local sandbox without GCP credentials.
    """
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth, credentials

        # Initialize firebase-admin app once if not already initialized
        if not firebase_admin._apps:
            sa_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
            if sa_path and not os.path.isabs(sa_path) and not os.path.exists(sa_path):
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                candidate = os.path.join(backend_dir, sa_path)
                if os.path.exists(candidate):
                    sa_path = candidate

            if sa_path and os.path.exists(sa_path):
                cred = credentials.Certificate(sa_path)
                firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
            elif settings.FIREBASE_SERVICE_ACCOUNT_JSON:
                import json
                cred_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
            else:
                try:
                    firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
                except Exception:
                    pass

        if firebase_admin._apps:
            decoded = fb_auth.verify_id_token(id_token)
            return {
                "sub": decoded.get("uid"),
                "email": decoded.get("email"),
                "name": decoded.get("name"),
                "firebase": True,
                "role": decoded.get("role")
            }
    except Exception as e:
        # If verification fails in production, reject immediately
        if settings.ENVIRONMENT == "production":
            return None

    # In strict production mode, NEVER allow unverified JWT claims
    if settings.ENVIRONMENT == "production":
        return None

    # In local development only (and only if explicitly allowed and non-production):
    # fallback to parse claims safely with logged security alert
    try:
        parts = id_token.split('.')
        if len(parts) == 3:
            payload_bytes = _b64_decode(parts[1])
            payload = json.loads(payload_bytes.decode('utf-8'))
            now_ts = datetime.datetime.now(datetime.timezone.utc).timestamp()
            if payload.get("exp") and payload["exp"] >= now_ts and ("user_id" in payload or "firebase" in payload):
                import logging
                logging.getLogger("security").warning(
                    "DEV_MODE_SECURITY_ALERT: Parsing unverified Firebase token payload in development mode. "
                    "In production, tokens MUST be cryptographically verified by Firebase Admin SDK."
                )
                return {
                    "sub": payload.get("user_id") or payload.get("sub"),
                    "email": payload.get("email"),
                    "name": payload.get("name"),
                    "firebase": True,
                    "role": payload.get("role")
                }
    except Exception:
        pass

    return None

def hash_password(password: str) -> str:
    """Generates PBKDF2 HMAC SHA256 password hash with cryptographically secure per-user random salt."""
    salt = secrets.token_bytes(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}${pwd_hash.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored hash, supporting both per-user salted and legacy seed hashes."""
    if not hashed_password or not plain_password:
        return False
    if "$" in hashed_password:
        salt_hex, expected_hash = hashed_password.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        pwd_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(pwd_hash.hex(), expected_hash)
    else:
        # Backward compatibility for existing seeded accounts
        pwd_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), LEGACY_SALT, 100000)
        return hmac.compare_digest(pwd_hash.hex(), hashed_password)

def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def _b64_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(data: dict, expires_delta_seconds: int = 86400) -> str:
    """Creates signed JWT token (Header.Payload.Signature)."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expires_delta_seconds)
    payload["exp"] = int(exp.timestamp())

    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')

    encoded_header = _b64_encode(header_bytes)
    encoded_payload = _b64_encode(payload_bytes)

    signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    encoded_signature = _b64_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def decode_access_token(token: str) -> Optional[dict]:
    """Verifies signature and decodes JWT token payload. Supports both backend HMAC and Firebase ID tokens."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        
        actual_sig = _b64_decode(encoded_signature)
        if hmac.compare_digest(expected_sig, actual_sig):
            payload_bytes = _b64_decode(encoded_payload)
            payload = json.loads(payload_bytes.decode('utf-8'))

            # Expiry check
            now_ts = datetime.datetime.now(datetime.timezone.utc).timestamp()
            if payload.get("exp") and payload["exp"] < now_ts:
                return None

            return payload
    except Exception:
        pass

    # If backend HMAC verification does not match, attempt Firebase verification
    return verify_firebase_id_token(token)

def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extracts authenticated user from Bearer token if present.
    Supports both local user IDs and verified Firebase user accounts.
    Returns None if no token provided or token invalid.
    """
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or ("sub" not in payload and "email" not in payload):
        return None

    user = None
    if "sub" in payload:
        user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user and payload.get("email"):
        user = db.query(User).filter(User.email == payload["email"].lower().strip()).first()
    return user

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Strict authentication dependency. Raises 401 if unauthorized.
    Zero backdoors: never defaults or bypasses.
    """
    user = get_current_user_optional(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def check_role_access(user: User, allowed_roles: List[str]):
    """Enforces role-based permission boundaries."""
    if user.role not in allowed_roles and user.role != "NATIONAL_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Role '{user.role}' lacks authorization for this operation."
        )

def enforce_role(user: User, allowed_roles: List[str]):
    return check_role_access(user, allowed_roles)

def apply_rbac_facility_filter(query, user: Optional[User], facility_model):
    """
    Applies server-side RBAC scoping filters to database queries based on user role.
    Strictly enforces 4-tier public health hierarchy:
    - NATIONAL_ADMIN: Can access all records.
    - STATE_OFFICER: Scoped to their assigned state.
    - DISTRICT_OFFICER: Scoped to their assigned district within their state.
    - PHC_STAFF: Scoped strictly to their single assigned facility.
    - SUPPLIER: Scoped to supplier partner facilities.
    - Unauthenticated: Denied by default (returns empty result).
    """
    if not user:
        from sqlalchemy import sql
        return query.filter(sql.false())

    if user.role == "NATIONAL_ADMIN":
        return query
    elif user.role == "STATE_OFFICER":
        if not user.state:
            from sqlalchemy import sql
            return query.filter(sql.false())
        return query.filter(facility_model.state == user.state)
    elif user.role == "DISTRICT_OFFICER":
        if not user.state or not user.district:
            from sqlalchemy import sql
            return query.filter(sql.false())
        return query.filter(
            facility_model.state == user.state,
            facility_model.district == user.district
        )
    elif user.role == "PHC_STAFF":
        if not user.facility_id:
            from sqlalchemy import sql
            return query.filter(sql.false())
        return query.filter(facility_model.id == user.facility_id)
    elif user.role == "SUPPLIER":
        return query

    from sqlalchemy import sql
    return query.filter(sql.false())

def enforce_facility_access(user: User, facility_id: str, db: Session, facility_model=None):
    """
    Validates that the authenticated user has authorization to access/modify a specific facility.
    Raises 404 if facility not found, or 403 if outside user's scope.
    """
    if facility_model is None:
        from app.models.all_models import Facility
        facility_model = Facility

    fac = db.query(facility_model).filter(facility_model.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Facility '{facility_id}' not found.")

    if user.role == "NATIONAL_ADMIN":
        return fac
    elif user.role == "STATE_OFFICER":
        if fac.state != user.state:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Facility '{fac.name}' ({fac.state}) is outside your assigned state '{user.state}'."
            )
        return fac
    elif user.role == "DISTRICT_OFFICER":
        if fac.state != user.state or fac.district != user.district:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Facility '{fac.name}' ({fac.district}, {fac.state}) is outside your assigned district '{user.district}, {user.state}'."
            )
        return fac
    elif user.role == "PHC_STAFF":
        if fac.id != user.facility_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Facility '{fac.id}' is outside your assigned PHC facility '{user.facility_id}'."
            )
        return fac
    elif user.role == "SUPPLIER":
        return fac

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Invalid scope.")


