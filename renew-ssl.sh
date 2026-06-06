#!/bin/bash
set -e

# ============================================================
# autoCRM — Renew Let's Encrypt SSL Certificate
# ============================================================
# This script is called automatically by cron.
# You can also run it manually:
#   ./renew-ssl.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/ssl-renew.log"
mkdir -p "$SCRIPT_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting SSL renewal check..."

# Renew certificates
if sudo certbot renew --quiet; then
    log "✅ Certificate renewed successfully or not yet due."
    
    # Reload Nginx to pick up new certificates
    log "🔄 Reloading Nginx container..."
    if docker compose -f "$SCRIPT_DIR/docker-compose.prod.yml" exec frontend nginx -s reload 2>/dev/null; then
        log "✅ Nginx reloaded."
    else
        log "⚠️  Nginx reload failed, restarting container..."
        docker compose -f "$SCRIPT_DIR/docker-compose.prod.yml" restart frontend
        log "✅ Nginx container restarted."
    fi
else
    log "❌ Certificate renewal failed!"
    log "   Check: sudo certbot renew --dry-run"
    exit 1
fi

log "Renewal check finished."
