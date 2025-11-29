# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.mongo import get_client, get_db
from app.routers.matters import router as matters_router
from app.routers.cases import router as cases_router

# Store database reference for dependency injection
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    global db
    try:
        client = get_client()
        db = get_db()
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise
    
    yield
    
    # Shutdown: Close MongoDB connection
    if client:
        client.close()
        print("🔌 MongoDB connection closed")

app = FastAPI(title="Law Matters API", version="1.0.0", lifespan=lifespan)

# Include routers
app.include_router(matters_router)
app.include_router(cases_router)

@app.get("/")
def home():
    return {"message": "Law Matters API is running 🚀"}
