@echo off
echo Installing frontend dependencies...
cd /d "%~dp0"
call npm install
echo.
echo Dependencies installed successfully!
echo.
echo To start the development server, run:
echo npm start
pause