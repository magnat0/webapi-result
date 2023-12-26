from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from sqlalchemy import select
from fastapi import Response
from fastapi.security.utils import get_authorization_scheme_param
from starlette.requests import Request
from fastapi import APIRouter
from schemas import UserIn
from models import User

from database import get_db_session

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class CookieOAuth2(OAuth2PasswordBearer):
    async def __call__(self, request: Request):
        authorization: str = request.cookies.get("access_token")
        scheme, param = get_authorization_scheme_param(authorization)
        if not authorization or scheme.lower() != "bearer":
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
                )
            else:
                return None
        return param

oauth2_scheme = CookieOAuth2(tokenUrl="token")

auth_router = APIRouter()

async def authenticate_user(db, username: str, password: str):
    user = await db.execute(select(User).where(User.username == username))
    user = user.scalars().first()
    if not user:
        return False
    if not pwd_context.verify(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@auth_router.post("/token")
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db_session)):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
    return {"message": "Logged in"}

@auth_router.post("/register")
async def register(user_in: UserIn, db = Depends(get_db_session)):
    user = User()
    user.username = user_in.username
    user.hashed_password = pwd_context.hash(user_in.password)
    user.is_admin = False
    db.add(user)
    await db.commit()
    return {"message": "User has been created"}

async def get_current_user(db = Depends(get_db_session), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await db.execute(select(User).where(User.username == username))
    user = user.scalars().first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(db = Depends(get_db_session), user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return user

@auth_router.get("/users/me")
async def read_users_me(user: User = Depends(get_current_user)):
    return {"username": user.username, "is_admin": user.is_admin}

@auth_router.get("/admin/users")
async def read_all_users(db = Depends(get_db_session), admin: User = Depends(get_current_admin)):
    users = await db.execute(select(User))
    return users.scalars().all()

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}