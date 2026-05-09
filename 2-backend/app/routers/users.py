from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserResponse, PinRequest
from app.models.user import UserModel
from app.core.deps import get_current_user
from app.db.mongodb import get_database
from app.utils.security import get_password_hash, verify_password

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    """
    Get current user profile.
    Also returns 'has_pin' (true/false) so frontend knows if it should ask for setup or unlock.
    """
    # Convert model to dict to inject custom field not in the DB model
    user_dict = current_user.model_dump()
    user_dict["has_pin"] = bool(current_user.quiz_pin)
    return user_dict

@router.put("/pin")
async def set_pin(pin_data: PinRequest, current_user: UserModel = Depends(get_current_user)):
    """Set or Update the Parent PIN."""
    db = get_database()
    hashed_pin = get_password_hash(pin_data.pin)
    
    await db["users"].update_one(
        {"email": current_user.email},
        {"$set": {"quiz_pin": hashed_pin}}
    )
    return {"message": "PIN set successfully"}

@router.post("/pin/verify")
async def verify_pin_endpoint(pin_data: PinRequest, current_user: UserModel = Depends(get_current_user)):
    """Verify the PIN to unlock Parent Mode."""
    if not current_user.quiz_pin:
        raise HTTPException(status_code=400, detail="PIN not set")
    
    if not verify_password(pin_data.pin, current_user.quiz_pin):
        raise HTTPException(status_code=401, detail="Incorrect PIN")
        
    return {"message": "Access granted"}

@router.delete("/pin")
async def reset_pin(current_user: UserModel = Depends(get_current_user)):
    """Reset/Remove the PIN (Forgot PIN flow)."""
    db = get_database()
    await db["users"].update_one(
        {"email": current_user.email},
        {"$set": {"quiz_pin": None}}
    )
    return {"message": "PIN reset successfully"}