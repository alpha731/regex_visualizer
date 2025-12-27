from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
# Ensure OPENAI_API_KEY is set in your environment or .env file
client = OpenAI(base_url=os.getenv("OPENAI_BASE_URL"), api_key=os.getenv("OPENAI_API_KEY"))

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    pattern: str
    message: str
    history: List[ChatMessage]

@app.get("/")
async def root():
    return {"message": "Regex Visualizer API"}

def generate_stream(messages: List[dict]):
    try:
        stream = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
            messages=messages,
            max_tokens=32768,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content

    except Exception as e:
        yield f"Error: {str(e)}"

@app.post("/chat")
async def chat(request: ChatRequest):
    messages = [
        {"role": "system", "content": "You are a helpful assistant that explains regular expressions. The user will provide a regex pattern and a question about it. Analyze the pattern and answer the question clearly."}
    ]
    
    for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": f"Regex Pattern: {request.pattern}\n\nQuestion: {request.message}"})

    return StreamingResponse(generate_stream(messages), media_type="text/plain")
