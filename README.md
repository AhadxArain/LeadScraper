# LeadScraper

Full-stack lead generation system: Python scraper + FastAPI backend, React + Vite dashboard.

## Setup (one time)

git clone https://github.com/AhadxArain/LeadScraper.git
cd LeadScraper

### Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
(then add your SERPER_API_KEY to .env)

### Frontend
cd ../frontend
npm install

## Run (every time)
Double-click start.bat
or manually:
  Terminal 1:  cd backend ; venv\Scripts\activate ; uvicorn api:app --port 8000
  Terminal 2:  cd frontend ; npm run dev

Open http://localhost:5173
