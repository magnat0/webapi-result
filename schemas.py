from pydantic import BaseModel, validator
from typing import Optional

class UserIn(BaseModel):
    username: str
    password: str

class CourseCreate(BaseModel):
    title : str
    description : str
    teachers : Optional[str] = "Неизвестно"
    is_active : Optional[bool] = False

    @validator('title', 'description')
    def check_empty(cls, value):
        if value == "":
            raise ValueError("Поле не может быть пустым")
        return value

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    teachers: Optional[str] = None
    is_active: Optional[bool] = None

class CommentCreate(BaseModel):
    text: str

class CommentUpdate(BaseModel):
    text: Optional[str] = None
