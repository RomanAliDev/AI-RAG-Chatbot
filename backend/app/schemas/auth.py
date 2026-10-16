from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    name :str=Field(..., min_length=1, max_length=100, description="User's name")
    email: EmailStr 
    password: str = Field(..., min_length=4, description="User's password")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4, description="User's password")