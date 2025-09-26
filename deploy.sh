#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Update packages
apt update -y
apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -SL https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create SSL folder
mkdir -p nginx/ssl

# Generate self-signed SSL if not present
if [ ! -f nginx/ssl/privkey.pem ]; then
    echo "Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=91.107.216.12"
fi

# Build and start Docker containers
docker-compose --env-file .env.production up --build -d

# Wait a few seconds for containers to initialize
sleep 10

# Show running containers
docker-compose ps

echo "✅ Deployment completed!"
echo "🌐 Access your app at: http://91.107.216.12 (HTTPS if SSL configured)"
echo "📖 View logs: docker-compose logs -f nextjs-app"
