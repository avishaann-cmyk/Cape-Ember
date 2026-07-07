#!/bin/bash

# Cape Ember Coffee Co. - Health Check Script
# Run this regularly (e.g., every 5 minutes via cron) to monitor application health

set -o pipefail

# Configuration
ENVIRONMENT="${1:-production}"
COMPOSE_FILE="docker-compose.yml"
if [ "${ENVIRONMENT}" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

API_URL="http://localhost"
if [ "${ENVIRONMENT}" = "production" ]; then
    API_URL="https://capeembercoffee.co.za"
fi

HEALTH_LOG="/var/log/cape-ember-health.log"
ALERT_EMAIL="alerts@capeembercoffee.co.za"
FAILED_CHECKS=0

# Functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> ${HEALTH_LOG}
}

check_container_status() {
    local container=$1
    if ! docker ps | grep -q ${container}; then
        log "ERROR: Container ${container} is not running"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
    return 0
}

check_service_health() {
    local url=$1
    local expected_code=$2
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "${url}" --connect-timeout 5)
    
    if [ "${response}" = "${expected_code}" ]; then
        return 0
    else
        log "ERROR: Health check failed for ${url} (got ${response}, expected ${expected_code})"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_database() {
    if docker exec cape-ember-mongodb-prod mongosh --eval "db.runCommand('ping')" &> /dev/null; then
        return 0
    else
        log "ERROR: MongoDB health check failed"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_disk_space() {
    local usage=$(docker exec cape-ember-mongodb-prod du -s /data/db | cut -f1)
    local usage_gb=$((usage / 1024 / 1024))
    
    if [ ${usage_gb} -gt 90000 ]; then
        log "WARNING: Database size is ${usage_gb}GB (approaching limits)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
    return 0
}

send_alert() {
    local subject="Cape Ember Coffee - Health Check Failed"
    local message="Health checks failed with ${FAILED_CHECKS} issue(s). Review logs at ${HEALTH_LOG}"
    
    if command -v mail &> /dev/null; then
        echo "${message}" | mail -s "${subject}" "${ALERT_EMAIL}"
    fi
}

# Main execution
log "=== Starting health check for ${ENVIRONMENT} environment ==="

# Check containers
check_container_status "cape-ember-backend" || true
check_container_status "cape-ember-frontend" || true
check_container_status "cape-ember-nginx" || true
check_container_status "cape-ember-mongodb" || true

# Check API endpoints
check_service_health "${API_URL}/health" "200" || true
check_service_health "${API_URL}/api/health" "200" || true

# Check database
check_database || true

# Check disk space
check_disk_space || true

# Summary
if [ ${FAILED_CHECKS} -eq 0 ]; then
    log "=== All health checks passed ==="
    exit 0
else
    log "=== ${FAILED_CHECKS} health check(s) failed ==="
    send_alert
    exit 1
fi
