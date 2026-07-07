# GitHub Actions Setup Guide

This guide explains how to configure GitHub Actions CI/CD pipeline for automated deployments.

## Prerequisites

- GitHub repository with production code
- GitHub Actions enabled (default for public repos)
- Production server with SSH access
- Docker Hub or GitHub Container Registry account

## 1. Create GitHub Secrets

Go to: **Settings → Secrets and variables → Actions**

### For Docker Image Registry

**If using GitHub Container Registry (recommended):**
```
GITHUB_TOKEN: Automatically available (no setup needed)
```

**If using Docker Hub:**
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub access token

### For Staging Deployment

- `STAGING_DEPLOY_KEY`: Private SSH key for staging server
- `STAGING_DEPLOY_HOST`: Staging server IP/hostname
- `STAGING_DEPLOY_USER`: SSH user (e.g., `deploy`)
- `STAGING_DEPLOY_PATH`: Deployment path (e.g., `/opt/cape-ember-coffee/capeembercoffee.co.za`)

### For Production Deployment

- `PRODUCTION_DEPLOY_KEY`: Private SSH key for production server
- `PRODUCTION_DEPLOY_HOST`: Production server IP/hostname
- `PRODUCTION_DEPLOY_USER`: SSH user (e.g., `deploy`)
- `PRODUCTION_DEPLOY_PATH`: Deployment path (e.g., `/opt/cape-ember-coffee/capeembercoffee.co.za`)

### Optional: Slack Notifications

- `SLACK_WEBHOOK`: Slack webhook URL for deployment notifications

## 2. Generate Deployment SSH Keys

```bash
# Generate SSH key pair for deployment
ssh-keygen -t rsa -b 4096 -f ~/.ssh/cape-ember-deploy -N ""

# Display private key (for GitHub secret)
cat ~/.ssh/cape-ember-deploy

# Add public key to server
cat ~/.ssh/cape-ember-deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 3. Setup Staging Server

```bash
# SSH to staging server
ssh deploy@staging.capeembercoffee.co.za

# Create deployment directory
mkdir -p /opt/cape-ember-coffee
cd /opt/cape-ember-coffee

# Clone repository
git clone https://github.com/capeembercoffee/capeembercoffee.co.za.git
cd capeembercoffee.co.za

# Create .env file
cp .env.production.example .env.staging
nano .env.staging

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker deploy

# Logout and login for group changes
logout
ssh deploy@staging.capeembercoffee.co.za
```

## 4. Setup Production Server

```bash
# SSH to production server
ssh deploy@capeembercoffee.co.za

# Create deployment directory
mkdir -p /opt/cape-ember-coffee
cd /opt/cape-ember-coffee

# Clone repository
git clone https://github.com/capeembercoffee/capeembercoffee.co.za.git
cd capeembercoffee.co.za

# Create .env file
cp .env.production.example .env.production
nano .env.production  # Add all production values

# Create SSL directory
mkdir -p ssl/certs

# Get SSL certificate from Let's Encrypt
sudo apt-get update
sudo apt-get install -y certbot

sudo certbot certonly --standalone \
  -d capeembercoffee.co.za \
  -d www.capeembercoffee.co.za

# Copy certificates
sudo cp /etc/letsencrypt/live/capeembercoffee.co.za/fullchain.pem ssl/certs/cert.pem
sudo cp /etc/letsencrypt/live/capeembercoffee.co.za/privkey.pem ssl/certs/key.pem
sudo chown deploy:deploy ssl/certs/*

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker deploy

# Setup SSL auto-renewal
sudo mkdir -p /etc/letsencrypt/renewal-hooks/post
sudo tee /etc/letsencrypt/renewal-hooks/post/cape-ember.sh > /dev/null << 'EOF'
#!/bin/bash
cp /etc/letsencrypt/live/capeembercoffee.co.za/fullchain.pem /opt/cape-ember-coffee/capeembercoffee.co.za/ssl/certs/cert.pem
cp /etc/letsencrypt/live/capeembercoffee.co.za/privkey.pem /opt/cape-ember-coffee/capeembercoffee.co.za/ssl/certs/key.pem
chown deploy:deploy /opt/cape-ember-coffee/capeembercoffee.co.za/ssl/certs/*
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/cape-ember.sh

# Logout and login for group changes
logout
ssh deploy@capeembercoffee.co.za
```

## 5. Create GitHub Environments

Go to: **Settings → Environments**

### Create "staging" Environment

- **Deployment branches**: `staging`
- **Secrets**: (inherit from repository)
- **Required reviewers**: Optional

### Create "production" Environment

- **Deployment branches**: `main`
- **Secrets**: (inherit from repository)
- **Required reviewers**: Recommended (at least 1)

## 6. GitHub Actions Workflow

The workflow file `.github/workflows/deploy.yml` includes:

### Jobs

1. **test-backend**
   - Runs Python tests with pytest
   - Uses MongoDB service container
   - Reports coverage to Codecov

2. **test-frontend**
   - Installs Node dependencies
   - Runs linting
   - Builds React application

3. **build-images**
   - Builds Docker images for backend and frontend
   - Pushes to GitHub Container Registry
   - Uses Docker buildx for multi-platform builds

4. **deploy-staging**
   - Triggered on push to `staging` branch
   - Deploys to staging environment
   - SSH into server and pull latest code

5. **deploy-production**
   - Triggered on push to `main` branch
   - Requires staging environment
   - Deploys to production environment
   - Runs health checks

## 7. Manual Trigger (Optional)

To manually trigger workflows in GitHub:

1. Go to **Actions** tab
2. Select workflow
3. Click **Run workflow**
4. Choose branch
5. Click **Run workflow**

## 8. Monitoring Deployments

### In GitHub

- Go to **Actions** tab
- View workflow run details
- Check logs for each job

### In Slack

If webhook configured, receive deployment notifications with:
- Status (success/failure)
- Commit info
- Author
- Branch

## 9. Troubleshooting

### Tests Failing

```bash
# Locally test backend
cd backend
pip install -r requirements.txt
pytest tests/ -v

# Locally test frontend
cd frontend
yarn install
yarn build
```

### Deployment SSH Issues

```bash
# Verify SSH key permissions
ls -la ~/.ssh/cape-ember-deploy
# Should be: -rw------- (600)

# Test SSH connection
ssh -i ~/.ssh/cape-ember-deploy deploy@production.com

# Check authorized_keys on server
cat ~/.ssh/authorized_keys | grep -A 1 "cape-ember"
```

### Docker Push Issues

Ensure GitHub Actions has permission to push images:
- Use `GITHUB_TOKEN` (automatic for GHCR)
- Or provide Docker Hub credentials

## 10. Best Practices

✅ **Do's**
- Keep secrets secure (never commit them)
- Use separate keys for each environment
- Review deployments with required reviewers
- Monitor logs for errors
- Keep workflow updated

❌ **Don'ts**
- Don't hardcode secrets in workflow files
- Don't use same SSH key for multiple servers
- Don't disable security checks
- Don't commit .env files
- Don't use production secrets in testing

## 11. Scaling Deployments

For high-traffic deployments, consider:

- Docker Swarm for multi-server orchestration
- Kubernetes for containerization
- Load balancing across multiple backend instances
- CDN for static assets
- Database replication

## Quick Reference

### Start fresh workflow
```yaml
name: Deploy
on:
  push:
    branches: [main, staging]
```

### Pass secret to job
```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

### SSH Deploy
```yaml
- name: Deploy
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    script: cd app && docker-compose pull && docker-compose up -d
```

## Support

For GitHub Actions documentation:
- https://docs.github.com/en/actions
- https://github.com/marketplace/actions

For workflow issues:
- Check workflow logs in GitHub UI
- Verify secrets are properly configured
- Test SSH connection manually
- Review Docker build output

---

**Last Updated**: 2026-07-07
**Version**: 1.0.0
