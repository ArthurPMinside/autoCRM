#!/bin/bash
set -e

# ============================================================
# autoCRM Production Deploy Script
# ============================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# ============================================================

echo "🚀 autoCRM Production Deploy"
echo "=============================="

# 1. Check .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Copy .env.example to .env and set your SECRET_KEY:"
    echo "   cp .env.example .env"
    exit 1
fi

# 2. Create data directory for SQLite
if [ ! -d data ]; then
    echo "📁 Creating data directory..."
    mkdir -p data
fi

# 3. Pull latest code (optional — uncomment if you use git on server)
# git pull origin main

# 4. Build and start containers
echo "🐳 Building Docker images..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache

echo "🟢 Starting services..."
docker compose -f docker-compose.prod.yml up -d

# 5. Cleanup
echo "🧹 Cleaning up old images..."
docker system prune -f

# 6. Detect SSL mode
if [ -f "nginx/nginx-ssl-active.conf" ]; then
    PROTO="https"
    SSL_STATUS="🔒 SSL enabled"
else
    PROTO="http"
    SSL_STATUS="🔓 HTTP only (run ./init-ssl.sh to enable HTTPS)"
fi

# 7. Get server IP for display
SERVER_IP=$(curl -s -4 ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

# 8. Status
echo ""
echo "✅ Deploy complete!"
echo ""
docker compose -f docker-compose.prod.yml ps
echo ""
echo "📊 Health check:"
sleep 2
curl -s http://localhost/health || echo "⚠️  Health check failed — wait a few seconds and try again"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  $SSL_STATUS"
echo ""
echo "  🌐 Web interface: ${PROTO}://${SERVER_IP}/"
echo "  🔌 API:           ${PROTO}://${SERVER_IP}/api/v1/"
echo ""
if [ "$PROTO" = "http" ]; then
    echo "  💡 To enable HTTPS + auto-renewal:"
    echo "     ./init-ssl.sh your-domain.com your@email.com"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
