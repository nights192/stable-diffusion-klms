from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

import asyncio
import uuid

from .lib.client_queue import UUIDPresentError, ClientQueue
from .lib.ai import txt2img

queue = ClientQueue()
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

    # A brittle method of validating the current transaction client,
    # but sufficient for such an isolated use-case.
    id = uuid.uuid4()

    while True:
        img_req = await websocket.receive_json()

        try:
            execRes = await queue.execute(id, 600.0, txt2img, img_req)
            await websocket.send_json({**{ "success": True }, **img_req})
        
        except UUIDPresentError:
            await websocket.send_json({ "success": False, "reason": "Already waiting on a task." })
        
        except asyncio.TimeoutError:
            await websocket.send_json({ "success": False, "reason": "Generation timed out." })