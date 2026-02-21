@echo off
REM Build script for AI Content Creator (Windows)
REM This script prepares the application for deployment

echo ====================================
echo AI Content Creator - Build Script
echo ====================================

REM Check if we're in the right directory
if not exist "react-frontend" (
    echo Error: react-frontend directory not found
    echo Please run this script from the project root directory
    exit /b 1
)

if not exist "backend" (
    echo Error: backend directory not found
    echo Please run this script from the project root directory
    exit /b 1
)

REM Clean up unnecessary files
echo.
echo Cleaning up unnecessary files...
python cleanup.py

REM Build frontend
echo.
echo Building React frontend...
cd react-frontend

REM Install dependencies
echo Installing dependencies...
call npm install

REM Build production bundle
echo Creating production build...
call npm run build

if %errorlevel% neq 0 (
    echo Frontend build failed!
    cd ..
    exit /b 1
)

echo Frontend build successful!
echo Build output: react-frontend/build/

cd ..

REM Check backend dependencies
echo.
echo Checking Python dependencies...
pip install -r requirements.txt --quiet

if %errorlevel% neq 0 (
    echo Failed to install backend dependencies!
    exit /b 1
)

echo Backend dependencies installed!

REM Run basic tests
echo.
echo Running basic checks...

python -c "import sys; sys.path.insert(0, 'backend'); import api_server" 2>nul
if %errorlevel% equ 0 (
    echo Backend imports successfully!
) else (
    echo Warning: Backend import check failed
)

echo.
echo ====================================
echo Build complete!
echo.
echo Next steps:
echo 1. Review the build output in react-frontend/build/
echo 2. Test locally before deploying
echo 3. Follow DEPLOYMENT.md for deployment instructions
echo.
echo Ready to deploy!
