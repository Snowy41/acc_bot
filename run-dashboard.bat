@echo off
echo Starting WhiteBot frontend and backend...

:: Start FastAPI backend
start cmd /k "uvicorn bot.dashboard_api:app --reload"

:: Start React frontend (Vite)
start cmd /k "cd web-dashboard && npm run dev"

echo Done!
pause
