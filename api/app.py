from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI, OpenAIError
import asyncio
from typing import Optional, AsyncGenerator

# Initialize FastAPI app
app = FastAPI(title="OpenAI Chat API")

# Enable CORS
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
    model: Optional[str] = "gpt-4.1-mini"
    api_key: str

# POST /api/chat endpoint
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        client = OpenAI(api_key=request.api_key)

        # Define async generator for streaming response
        async def generate() -> AsyncGenerator[str, None]:
            try:
                stream = client.chat.completions.create(
                    model=request.model,
                    messages=[
                        {"role": "system", "content": request.developer_message},
                        {"role": "user", "content": request.user_message},
                    ],
                    stream=True
                )

                for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
                        await asyncio.sleep(0)  # Yield control to event loop

            except OpenAIError as e:
                raise HTTPException(status_code=400, detail=f"OpenAI API error: {str(e)}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Streaming error: {str(e)}")

        return StreamingResponse(generate(), media_type="text/plain")

    except OpenAIError as e:
        raise HTTPException(status_code=400, detail=f"OpenAI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# GET /api/health
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Run only if file is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True)
