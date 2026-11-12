Encender Backend
uvicorn app.main:app --reload --port 8000

Encender webhook
cloudflared tunnel --url http://localhost:8000

Encender Web React
npm run dev