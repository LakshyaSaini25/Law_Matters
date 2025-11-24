# app/main.py
from fastapi import FastAPI
from app.routers.matters import router as matters_router   # NOTE the package prefix `app.`

app = FastAPI(title="Law Matters API", version="1.0.0")

# router already defines prefix "/matters" inside routers/matters.py
app.include_router(matters_router)

@app.get("/")
def home():
    return {"message": "Law Matters API is running 🚀"}
