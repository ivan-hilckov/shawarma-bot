#!/bin/bash
set -e

echo "🔧 Setting up Shawarma Bot development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp docker.env.example .env
    echo ""
    echo "⚠️  IMPORTANT: You need to set your BOT_TOKEN in .env file!"
    echo "   Edit .env and add your Telegram bot token."
    echo ""
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Pull Docker images
echo "🐳 Pulling Docker images..."
docker-compose pull

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file and add your BOT_TOKEN"
echo "2. Run 'npm run docker:up' to start services"
echo "3. Run 'npm run dev' to start development bot"
echo "4. Run 'npm run dev:api' to start development API"
