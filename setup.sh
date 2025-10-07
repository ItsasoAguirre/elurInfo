#!/bin/bash

# ElurInfo - Quick setup and configuration script
# Run from the project root directory

echo "🏔️ ElurInfo - MVP Setup"
echo "======================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print with colors
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verify we're in the correct directory
if [ ! -d "elurInfo-Backend" ] || [ ! -d "elurInfo-FrontEnd" ]; then
    print_error "This script must be run from the ElurInfo project root directory"
    exit 1
fi

echo ""
print_status "Checking system dependencies..."

# Verify Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ before continuing."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

print_success "npm $(npm --version) encontrado"

echo ""
print_status "=== CONFIGURANDO BACKEND ==="

cd elurInfo-Backend

# Instalar dependencias del backend
print_status "Instalando dependencias del backend..."
if npm install; then
    print_success "Dependencias del backend instaladas"
else
    print_error "Error al instalar dependencias del backend"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating configuration file .env..."
    cp .env.example .env
    print_success ".env file created from .env.example"
    print_warning "Review and configure variables in .env according to your needs"
else
    print_warning ".env file already exists, will not overwrite"
fi

# Create necessary directories
print_status "Creating data directories..."
mkdir -p data/backups
mkdir -p logs
print_success "Directories created"

# Run migrations
print_status "Running database migrations..."
npm run migrate:dev up
if [ $? -eq 0 ]; then
    print_success "Migrations executed successfully"
else
    print_error "Error running migrations"
    exit 1
fi

# Compile TypeScript
print_status "Compiling TypeScript..."
if npm run build; then
    print_success "Backend compiled successfully"
else
    print_warning "Error compiling TypeScript, but continuing..."
fi

cd ..

echo ""
print_status "=== SETTING UP FRONTEND ==="

cd elurInfo-FrontEnd

# Install frontend dependencies
print_status "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Error installing frontend dependencies"
    exit 1
fi

# Create icons directory if it doesn't exist
print_status "Configuring PWA..."
mkdir -p public/icons
print_success "Icons directory created"

cd ..

# Instalar dependencias raíz (para conventional commits)
echo ""
print_status "Instalando herramientas de desarrollo..."
npm install
if [ $? -eq 0 ]; then
    print_success "Development tools installed"
else
    print_warning "Error installing development dependencies, but continuing..."
fi

# Configure git hooks
print_status "Setting up Git Hooks..."
npx husky install 2>/dev/null
git config commit.template .gitmessage
print_success "Git configured for Conventional Commits"

echo ""
print_success "=== SETUP COMPLETED ==="
echo ""
echo "🚀 To start the project:"
echo ""
echo "1. Backend (in one terminal):"
echo "   cd elurInfo-Backend"
echo "   npm run dev"
echo ""
echo "2. Frontend (in another terminal):"
echo "   cd elurInfo-FrontEnd"  
echo "   npm run dev"
echo ""
echo "3. Open in browser:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000"
echo "   Health Check: http://localhost:3000/health"
echo ""
echo "📋 API URLs:"
echo "   GET /avalancha       - Avalanche bulletins"
echo "   GET /montana         - Mountain forecasts"
echo "   GET /municipio/22015 - Municipal forecast (eg: Benasque)"
echo ""
echo "📝 Commit Commands:"
echo "   npm run commit    - Use Conventional Commits wizard"
echo "   git commit        - Manual commit (automatically validated)"
echo ""
echo "⚙️  Additional configuration:"
echo "   - Edit elurInfo-Backend/.env to configure variables"
echo "   - Data is saved in elurInfo-Backend/data/"
echo "   - Logs are saved in elurInfo-Backend/logs/"
echo ""
print_warning "Note: This MVP uses mock data. AEMET integration is prepared but not implemented."
echo ""
print_success "ElurInfo MVP is ready to use! 🏔️"