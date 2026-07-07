#!/bin/bash

# Cape Ember Coffee Co. - Deployment Script
# This script handles building, testing, and deploying the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-cape-ember}"
BACKEND_IMAGE="${DOCKER_REGISTRY}/backend:latest"
FRONTEND_IMAGE="${DOCKER_REGISTRY}/frontend:latest"
ENVIRONMENT="${ENVIRONMENT:-staging}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build images
build_images() {
    log_info "Building Docker images..."
    
    log_info "Building backend image..."
    docker build -t ${BACKEND_IMAGE} ./backend
    log_success "Backend image built: ${BACKEND_IMAGE}"
    
    log_info "Building frontend image..."
    docker build -t ${FRONTEND_IMAGE} ./frontend
    log_success "Frontend image built: ${FRONTEND_IMAGE}"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    if [ -f "./backend/backend_test.py" ]; then
        log_info "Running backend tests..."
        docker run --rm \
            -v "$(pwd)/backend:/app" \
            -v "$(pwd)/backend/tests:/app/tests" \
            ${BACKEND_IMAGE} \
            pytest tests/ -v
        log_success "Backend tests passed"
    fi
    
    log_warning "Frontend tests: Skipped (configure as needed)"
}

# Push images to registry
push_images() {
    if [ -z "$REGISTRY_URL" ]; then
        log_warning "REGISTRY_URL not set, skipping image push"
        return
    fi
    
    log_info "Pushing images to registry..."
    docker push ${BACKEND_IMAGE}
    docker push ${FRONTEND_IMAGE}
    log_success "Images pushed to registry"
}

# Deploy to environment
deploy() {
    log_info "Deploying to ${ENVIRONMENT}..."
    
    local COMPOSE_FILE="docker-compose.yml"
    if [ "${ENVIRONMENT}" = "production" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    if [ ! -f "${COMPOSE_FILE}" ]; then
        log_error "Compose file not found: ${COMPOSE_FILE}"
        exit 1
    fi
    
    # Check environment file
    if [ "${ENVIRONMENT}" = "production" ]; then
        if [ ! -f ".env.production" ]; then
            log_error ".env.production not found. Copy from .env.production.example and fill in values"
            exit 1
        fi
    fi
    
    log_info "Stopping existing containers..."
    docker-compose -f ${COMPOSE_FILE} down || true
    
    log_info "Pulling latest images..."
    docker-compose -f ${COMPOSE_FILE} pull || true
    
    log_info "Starting services..."
    docker-compose -f ${COMPOSE_FILE} up -d
    
    log_success "Deployment started"
    
    # Wait for services to be ready
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    log_info "Checking service health..."
    docker-compose -f ${COMPOSE_FILE} ps
    
    log_success "Deployment completed successfully"
}

# Rollback to previous version
rollback() {
    log_warning "Rollback functionality not yet implemented"
    log_info "Manual steps:"
    log_info "1. Check git history: git log --oneline"
    log_info "2. Checkout previous version: git checkout <commit-hash>"
    log_info "3. Rebuild and deploy"
}

# Show logs
show_logs() {
    local COMPOSE_FILE="docker-compose.yml"
    if [ "${ENVIRONMENT}" = "production" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    docker-compose -f ${COMPOSE_FILE} logs -f --tail=100
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    local COMPOSE_FILE="docker-compose.yml"
    if [ "${ENVIRONMENT}" = "production" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    docker-compose -f ${COMPOSE_FILE} ps
    
    log_info "Checking endpoints..."
    if command -v curl &> /dev/null; then
        curl -s http://localhost/health | head -c 50 && echo "..." || log_warning "Health endpoint check failed"
    fi
}

# Main menu
show_usage() {
    cat << EOF
${BLUE}Cape Ember Coffee Co. - Deployment Script${NC}

Usage: ./deploy.sh [COMMAND] [OPTIONS]

Commands:
    check           Check prerequisites
    build           Build Docker images
    test            Run tests
    push            Push images to registry
    deploy          Deploy application
    rollback        Rollback to previous version
    logs            Show application logs
    health          Check application health
    clean           Stop and remove containers
    help            Show this help message

Options:
    --env ENV       Set environment (staging, production) [default: staging]
    --registry URL  Set Docker registry URL
    --no-tests      Skip running tests before deployment

Examples:
    ./deploy.sh build --env staging
    ./deploy.sh deploy --env production
    ./deploy.sh logs --env production

EOF
}

# Parse arguments
COMMAND=${1:-help}
shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --registry)
            REGISTRY_URL="$2"
            shift 2
            ;;
        --no-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Execute command
case ${COMMAND} in
    check)
        check_prerequisites
        ;;
    build)
        check_prerequisites
        build_images
        ;;
    test)
        run_tests
        ;;
    push)
        push_images
        ;;
    deploy)
        check_prerequisites
        if [ -z "$SKIP_TESTS" ]; then
            run_tests
        fi
        deploy
        health_check
        ;;
    rollback)
        rollback
        ;;
    logs)
        show_logs
        ;;
    health)
        health_check
        ;;
    clean)
        log_info "Stopping and removing containers..."
        docker-compose down -v
        log_success "Cleanup completed"
        ;;
    help)
        show_usage
        ;;
    *)
        log_error "Unknown command: ${COMMAND}"
        show_usage
        exit 1
        ;;
esac
