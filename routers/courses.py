from fastapi import APIRouter, HTTPException, Depends
from database import get_db_session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, NoResultFound
from models import *
from schemas import *
from sqlalchemy.orm import joinedload

course_router = APIRouter()

@course_router.get("/courses")
async def read_root(session = Depends(get_db_session)):
    stms = select(Course)
    courses = await session.scalars(stms)
    data = courses.all()
    return data

@course_router.get("/courses/{course_id}")
async def read_item(course_id: int, session = Depends(get_db_session)):
    try:
        stmt = select(Course).options(joinedload(Course.comments)).where(Course.id == course_id)
        course = await session.scalars(stmt)
        course = course.first()
        return course
    except NoResultFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    

@course_router.post("/courses")
async def create_item(data: CourseCreate, session = Depends(get_db_session)):
    course = Course(**data.dict())
    session.add(course)
    try:
        await session.commit()
        await session.refresh(course)
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    else: return course

@course_router.put("/course/{course_id}")
async def update_item(course_id: int, data: CourseUpdate, session = Depends(get_db_session)):
    try:
        stmt = select(Course).where(Course.id == course_id)
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

@course_router.delete("/courses/{course_id}")
async def delete_course(course_id: int, session = Depends(get_db_session)):
    try:
        stmt = select(Course).where(Course.id == course_id)
        item = await session.scalars(stmt)
        data = item.first()
        course_data = {
            "id": data.id,
            "title": data.title,
            "description": data.description,
            "teachers": data.teachers,
            "is_active": data.is_active
        }
        await session.delete(data)
        await session.commit()
        return course_data
    except NoResultFound as e:
        raise HTTPException(status_code=404, detail=str(e))