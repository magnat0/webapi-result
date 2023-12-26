from fastapi import  HTTPException, Depends, APIRouter
from database import get_db_session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, NoResultFound
from models import *
from schemas import *

comment_router = APIRouter()

@comment_router.post("/course/{course_id}/comment")
async def create_comment(course_id: int, data: CommentCreate,  session = Depends(get_db_session)):
    try:
        comment = Comment(**data.dict(), courses_id = course_id)
        session.add(comment)
        await session.commit()
        await session.refresh(comment)
        return comment
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@comment_router.get("/comments/{comment_id}")
async def get_course_comments2(comment_id: int, session = Depends(get_db_session)):
    try:
        stmt = select(Comment).where(Comment.id == comment_id)
        course = await session.scalars(stmt)
        course = course.one()
        return course
    except NoResultFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@comment_router.put("/comments/{comment_id}")
async def update_comment(comment_id: int, data: CommentUpdate, session = Depends(get_db_session)):
    try:
        stmt = select(Comment).where(Comment.id == comment_id)
        course = await session.scalars(stmt)
        course = course.one()
        for key, value in data.dict().items():
                if value is not None:
                    setattr(course, key, value) 
        await session.commit()
        await session.refresh(course)
        return course
    except NoResultFound as e:
        raise HTTPException(status_code=404, detail=str(e))  
    
@comment_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: int, session = Depends(get_db_session)):
    try:
        stmt = select(Comment).where(Comment.id == comment_id)
        item = await session.scalars(stmt)
        data = item.one()
        await session.delete(data)
        await session.commit()
        return data
    except NoResultFound as e:
        raise HTTPException(status_code=404, detail=str(e))