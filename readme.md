cd .\backend\
python -m venv venv
venv/Scripts/activate
pip install -r reqirements.txt
uvicorn app.main:app --reload


cd ..
cd .\frontend\
npm i
npm run dev