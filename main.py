import uvicorn
from fastapi import FastAPI, WebSocket, Request, WebSocketDisconnect
from auth import auth_router
from routers.comments import comment_router
from routers.courses import course_router
from models import *
from schemas import *
app = FastAPI()
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

app.include_router(auth_router)
app.include_router(course_router)
app.include_router(comment_router)

templates = Jinja2Templates(directory="templates")
@app.get("/", response_class=HTMLResponse)
async def get_html_all_curses(request: Request):
    http_protocol = request.headers.get("x-forwarded-proto", "http")
    ws_protocol = "wss" if http_protocol == "https" else "ws"
    server_run = request.url.netloc
    return templates.TemplateResponse("index.html", {"request": request,
                                                     "http_protocol": http_protocol,
                                                     "ws_protocol" : ws_protocol,
                                                     "server_run" : server_run})

@app.get("/{course_id}", response_class=HTMLResponse)
async def get_html_course(course_id, request: Request, ):
    http_protocol = request.headers.get("x-forwarded-proto", "http")
    ws_protocol = "wss" if http_protocol == "https" else "ws"
    server_run = request.url.netloc
    return templates.TemplateResponse("course.html", {"request": request, 
                                                      "course_id" : course_id,
                                                      "http_protocol": http_protocol,
                                                     "ws_protocol" : ws_protocol,
                                                     "server_run" : server_run})

active_connections1 = []
active_connections2 =[]
active_connections3 ={}
active_connections4 ={}
active_connections5 = {}
active_connections6 = []

@app.websocket("/ws")
async def add_course(websocket: WebSocket):
    await websocket.accept()
    active_connections1.append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            for connection in active_connections1:
                await connection.send_json(data)
    except WebSocketDisconnect:
        active_connections1.remove(websocket)

@app.websocket("/ws2")
async def delete_course(websocket: WebSocket):
    await websocket.accept()
    active_connections2.append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            for connection in active_connections2:
                await connection.send_json(data)
    except WebSocketDisconnect:
        active_connections2.remove(websocket)

@app.websocket("/ws/append_comments/{course_id}")
async def add_comment(course_id : int, websocket: WebSocket):
    if course_id not in active_connections3:
        active_connections3[course_id] = []
    await websocket.accept()
    active_connections3[course_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            for connection in active_connections3[course_id]:
                await connection.send_json(data)
    except WebSocketDisconnect:
        active_connections3[course_id].remove(websocket)

@app.websocket("/ws/delete_comments/{course_id}")
async def delete_comment(course_id : int, websocket: WebSocket):
    if course_id not in active_connections4:
        active_connections4[course_id] = []
    await websocket.accept()
    active_connections4[course_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            for connection in active_connections4[course_id]:
                await connection.send_json(data)
    except WebSocketDisconnect:
        active_connections4[course_id].remove(websocket)

@app.websocket("/ws/update_comments/{course_id}")
async def update_comment(course_id : int, websocket: WebSocket):
    if course_id not in active_connections5:
        active_connections5[course_id] = []
    await websocket.accept()
    active_connections5[course_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            for connection in active_connections5[course_id]:
                if(connection != websocket):
                    await connection.send_json(data)
    except WebSocketDisconnect:
        active_connections5[course_id].remove(websocket)

@app.websocket("/ws/update_course")
async def update_course(websocket: WebSocket):
    await websocket.accept()
    active_connections6.append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            for connection in active_connections6:
                await connection.send_json(data)
    except WebSocketDisconnect:
        active_connections6.remove(websocket)

app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)