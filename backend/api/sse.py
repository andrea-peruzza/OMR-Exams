from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
import json
from state.manager import task_manager

router = APIRouter()

async def event_generator(task_id: str):
    while True:
        task = task_manager.get_task(task_id)
        if not task:
            yield f"data: {json.dumps({'error': 'Task not found'})}\n\n"
            break
            
        yield f"data: {json.dumps(task)}\n\n"
        
        if task.get("completed", False):
            break
            
        await asyncio.sleep(0.5)

@router.get("/stream/{task_id}")
async def stream_progress(task_id: str):
    return StreamingResponse(event_generator(task_id), media_type="text/event-stream")
