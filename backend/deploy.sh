#!/bin/bash
# deploy.sh - Run this on your VPS

echo "🚀 Starting IMFuyo API Deployment..."

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install --production

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.production..."
    cp .env.production .env
    echo "⚠️  Please edit .env file with your actual values!"
fi

# Setup PM2 to start on boot
echo "🔧 Setting up PM2 startup..."
pm2 startup systemd

echo "✅ Setup complete! Next steps:"
echo "1. Edit .env file with your actual database credentials"
echo "2. Run: pm2 start server.js --name imfuyo-api -i max"
echo "3. Run: pm2 save"