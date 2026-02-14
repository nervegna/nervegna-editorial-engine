#!/bin/bash

# Setup script for Nervegna Editorial Engine
# Usage: ./scripts/setup.sh

set -e

echo "🚀 Nervegna Editorial Engine - Setup Script"
echo "==========================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your API keys and credentials"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create required directories
echo "Creating directories..."
mkdir -p output logs data/raw data/processed
echo "✅ Directories created"
echo ""

# Set executable permissions
chmod +x src/index.js
echo "✅ Executable permissions set"
echo ""

# Test configuration
echo "Testing configuration..."
if grep -q "your_anthropic_api_key_here" .env; then
    echo "⚠️  WARNING: Default API key detected in .env"
    echo "   Please update ANTHROPIC_API_KEY before running"
else
    echo "✅ Configuration appears updated"
fi
echo ""

echo "=========================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your API keys (see docs/SETUP.md)"
echo "2. Test: npm start -- --now"
echo "3. Start scheduler: npm start"
echo ""
echo "Documentation:"
echo "- Setup guide: docs/SETUP.md"
echo "- Architecture: docs/ARCHITECTURE.md"
echo "- Main README: README.md"
echo ""
