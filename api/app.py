from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import openai
import os
from typing import Optional, AsyncGenerator

app = FastAPI(title="OpenAI Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema
class ChatRequest(BaseModel):
    developer_message: str
    user_message: str
    model: Optional[str] = "gpt-3.5-turbo"  # gpt-4 also works if you have access

@app.post("/api/chat")
async def chat(request: ChatRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set in environment")

    openai.api_key = api_key

    async def generate() -> AsyncGenerator[str, None]:
        try:
            # OpenAI doesn't support async; so wrap in a thread
            response = await asyncio.to_thread(
                lambda: openai.ChatCompletion.create(
                    model=request.model,
                    messages=[
                        {"role": "system", "content": request.developer_message},
                        {"role": "user", "content": request.user_message},
                    ],
                    stream=True
                )
            )

            for chunk in response:
                content = chunk["choices"][0]["delta"].get("content", "")
                if content:
                    yield content
                    await asyncio.sleep(0)

        except openai.error.OpenAIError as e:
            raise HTTPException(status_code=400, detail=f"OpenAI API error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Streaming error: {str(e)}")

    return StreamingResponse(generate(), media_type="text/plain")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
