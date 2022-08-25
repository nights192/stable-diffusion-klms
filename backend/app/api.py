from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",
    "localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Root of the coming site."}

@app.websocket("/channel")
async def image_endpoint(websocket: WebSocket):
    await websocket.accept()

    while True:
        img_req = await websocket.receive_json()
        await websocket.send_json({ "msg": "Silly." })