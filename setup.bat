@echo off
setlocal enabledelayedexpansion

:: ElurInfo - Quick setup and configuration script for Windows
:: Run from the project root directory

echo 🏔️ ElurInfo - MVP Setup
echo =======================
echo.

:: Verify we're in the correct directory
if not exist "elurInfo-Backend" (
    echo [ERROR] This script must be run from the ElurInfo project root directory
    pause
    exit /b 1
)

if not exist "elurInfo-FrontEnd" (
    echo [ERROR] This script must be run from the ElurInfo project root directory
    pause
    exit /b 1
)

echo [INFO] Checking system dependencies...

:: Verify Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ before continuing.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js found
node --version

:: Verify npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

echo [SUCCESS] npm found
npm --version

echo.
echo [INFO] === SETTING UP BACKEND ===

cd elurInfo-Backend

:: Install backend dependencies
echo [INFO] Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Error installing backend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating configuration file .env...
    copy .env.example .env >nul
    echo [SUCCESS] .env file created from .env.example
    echo [WARNING] Review and configure variables in .env according to your needs
) else (
    echo [WARNING] .env file already exists, will not overwrite
)

:: Create necessary directories
echo [INFO] Creating data directories...
if not exist "data" mkdir data
if not exist "data\backups" mkdir data\backups
if not exist "logs" mkdir logs
echo [SUCCESS] Directories created

:: Run migrations
echo [INFO] Running database migrations...
call npm run migrate:dev up
if %errorlevel% neq 0 (
    echo [ERROR] Error running migrations
    pause
    exit /b 1
)
echo [SUCCESS] Migrations executed successfully

:: Compile TypeScript
echo [INFO] Compiling TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Error compiling TypeScript, but continuing...
) else (
    echo [SUCCESS] Backend compiled successfully
)

cd ..

echo.
echo [INFO] === SETTING UP FRONTEND ===

cd elurInfo-FrontEnd

:: Install frontend dependencies
echo [INFO] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Error installing frontend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Frontend dependencies installed

:: Create icons directory if it doesn't exist
echo [INFO] Configuring PWA...
if not exist "public\icons" mkdir public\icons
echo [SUCCESS] Icons directory created

cd ..

# Install root dependencies (for conventional commits)
echo [INFO] Installing development tools...
call npm install
if %errorlevel% neq 0 (
    echo [WARNING] Error installing development dependencies, but continuing...
) else (
    echo [SUCCESS] Development tools installed
)

# Configure git hooks
echo [INFO] Setting up Git Hooks...
call npx husky install 2>nul
git config commit.template .gitmessage
echo [SUCCESS] Git configured for Conventional Commits

echo.
echo [SUCCESS] === SETUP COMPLETED ===
echo.
echo 🚀 To start the project:
echo.
echo 1. Backend (en una terminal):
echo    cd elurInfo-Backend
echo    npm run dev
echo.
echo 2. Frontend (en otra terminal):
echo    cd elurInfo-FrontEnd
echo    npm run dev
echo.
echo 3. Abrir en el navegador:
echo    Frontend: http://localhost:5173
echo    API Backend: http://localhost:3000
echo    Health Check: http://localhost:3000/health
echo.
echo 📋 URLs de la API:
echo    GET /avalancha       - Boletines de avalanchas
echo    GET /montana         - Predicciones de montaña
echo    GET /municipio/22015 - Predicción municipal (ej: Benasque)
echo.
echo 📋 Comandos de Commit:
echo    npm run commit    - Usar asistente de Conventional Commits
echo    git commit        - Commit manual (validado automáticamente)
echo.
echo ⚙️  Configuración adicional:
echo    - Edit elurInfo-Backend\.env to configure variables
echo    - Data is saved in elurInfo-Backend\data\
echo    - Logs are saved in elurInfo-Backend\logs\
echo.
echo [WARNING] Note: This MVP uses mock data. AEMET integration is prepared but not implemented.
echo.
echo [SUCCESS] ElurInfo MVP is ready to use! 🏔️

pause