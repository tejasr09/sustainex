@echo off
setlocal

set "ROOT=%~dp0"

echo Starting Sustainex backend and frontend...
echo.

REM Start backend in a new terminal window
start "Sustainex Backend" cmd /k "cd /d "%ROOT%backend" && if exist ".venv\Scripts\activate.bat" call ".venv\Scripts\activate.bat" && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

REM Start frontend in a new terminal window
start "Sustainex Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo Launched:
echo - Backend: http://127.0.0.1:8000
echo - Frontend: http://127.0.0.1:5173
echo.
echo You can close this launcher window now.

endlocal
