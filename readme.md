Project Setup Guide

Backend Setup (FastAPI)

Step 1: Go to backend folder
cd backend

Step 2: Create and activate virtual environment
python -m venv venv
venv/Scripts/activate

Step 3: Install dependencies
pip install -r requirements.txt

Step 4: Run the FastAPI server
uvicorn app.main:app --reload


Frontend Setup (React + Vite)

Step 1: Go to frontend folder
cd ..
cd frontend

Step 2: Install node modules
npm install

Step 3: Start development server
npm run dev


Backend runs on: http://localhost:8000
Frontend runs on: http://localhost:5173

Project setup complete.
