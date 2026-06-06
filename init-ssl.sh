#!/bin/bash
set -e

# ============================================================
# autoCRM — Initialize Let's Encrypt SSL Certificate
# ============================================================
# Usage:
#   chmod +x init-ssl.sh
#   ./init-ssl.sh your-domain.com your@email.com
# ============================================================

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ Usage: ./init-ssl.sh <domain> <email>"
    echo "   Example: ./init-ssl.sh crm.myservice.ru admin@myservice.ru"
    exit 1
fi

echo "🔒 Initializing SSL for: $DOMAIN"
echo "=============================================================="

# 1. Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot
fi

# 2. Prepare webroot for ACME challenges
mkdir -p certbot-webroot

# 3. Temporarily switch to HTTP-only config for validation
#    (nginx must be running on port 80 to serve .well-known or we use standalone)
echo "🛑 Stopping Nginx container to free port 80..."
docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true

# 4. Obtain certificate using standalone mode
echo "📝 Requesting certificate from Let's Encrypt..."
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --rsa-key-size 4096

# 5. Prepare SSL nginx config
echo "⚙️  Configuring Nginx for SSL..."
cp nginx/nginx-ssl.conf nginx/nginx-ssl-active.conf
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" nginx/nginx-ssl-active.conf

# 6. Update docker-compose to use SSL config and add certbot volumes
echo "🐳 Updating Docker Compose for SSL..."
cat > docker-compose.prod.yml <<EOF
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: autocrm-backend
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./data:/app/data
    networks:
      - autocrm-network
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  frontend:
    build:
      context: ./web
      dockerfile: Dockerfile.prod
    container_name: autocrm-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx/nginx-ssl-active.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot-webroot:/var/www/certbot:ro
    depends_on:
      - backend
    networks:
      - autocrm-network

networks:
  autocrm-network:
    driver: bridge
EOF

# 7. Start with SSL
echo "🚀 Starting with HTTPS..."
docker compose -f docker-compose.prod.yml up -d --build frontend

# 8. Setup auto-renewal cron
echo "⏰ Setting up auto-renewal..."
CRON_JOB="0 3 * * * $(pwd)/renew-ssl.sh >> $(pwd)/logs/ssl-renew.log 2>&1"
mkdir -p logs

# Remove old cron job for this path if exists
(crontab -l 2>/dev/null | grep -v "renew-ssl.sh" || true) | crontab -
# Add new cron job
(crontab -l 2>/dev/null || true; echo "$CRON_JOB") | crontab -

echo ""
echo "✅ SSL setup complete!"
echo ""
echo "🌐 Your CRM is now available at:"
echo "   https://$DOMAIN/"
echo ""
echo "📅 Auto-renewal scheduled daily at 03:00"
echo "   Logs: $(pwd)/logs/ssl-renew.log"
echo ""
echo "🔍 Verify certificate:"
echo "   openssl s_client -connect $DOMAIN:443 -servername $DOMAIN </dev/null"
