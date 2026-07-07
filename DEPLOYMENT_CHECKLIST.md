# Production Deployment Checklist

## Pre-Deployment

- [ ] Code reviewed and merged to main branch
- [ ] All tests passing in CI/CD pipeline
- [ ] Database backups configured
- [ ] SSL certificate obtained from Let's Encrypt
- [ ] Production environment variables prepared
- [ ] Domain DNS configured (A record pointing to server)
- [ ] Security group/firewall rules configured (80, 443)
- [ ] SSH keys for deployment configured
- [ ] Monitoring and alerting configured

## Deployment Steps

### 1. Server Preparation
```bash
# SSH into production server
ssh deploy@capeembercoffee.co.za

# Create deployment directory
sudo mkdir -p /opt/cape-ember-coffee
sudo chown deploy:deploy /opt/cape-ember-coffee

# Clone repository
cd /opt/cape-ember-coffee
git clone https://github.com/capeembercoffee/capeembercoffee.co.za.git
cd capeembercoffee.co.za
```

### 2. Environment Configuration
```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with actual production values
nano .env.production

# Verify permissions (should be readable only by deploy user)
chmod 600 .env.production
```

### 3. SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p ssl/certs

# Install Certbot if not present
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Generate Let's Encrypt certificate
sudo certbot certonly --standalone \
  -d capeembercoffee.co.za \
  -d www.capeembercoffee.co.za \
  --email admin@capeembercoffee.co.za \
  --agree-tos \
  --non-interactive

# Copy certificates to deployment directory
sudo cp /etc/letsencrypt/live/capeembercoffee.co.za/fullchain.pem ssl/certs/cert.pem
sudo cp /etc/letsencrypt/live/capeembercoffee.co.za/privkey.pem ssl/certs/key.pem
sudo chown deploy:deploy ssl/certs/*
```

### 4. Build Docker Images
```bash
# Build backend image
docker build -t cape-ember/backend:latest ./backend

# Build frontend image
docker build -t cape-ember/frontend:latest ./frontend

# Verify images
docker images | grep cape-ember
```

### 5. Deploy Application
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh deploy --env production

# Or manually with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### 6. Post-Deployment Verification
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Verify services are healthy
docker-compose -f docker-compose.prod.yml exec backend curl -s http://localhost:8000/health
docker-compose -f docker-compose.prod.yml exec frontend curl -s http://localhost:3000

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=50

# Verify database connection
docker-compose -f docker-compose.prod.yml exec backend python -c "
from motor.motor_asyncio import AsyncClient
import asyncio
async def test():
    client = AsyncClient('mongodb://...')
    await client.admin.command('ping')
asyncio.run(test())
"
```

### 7. Site Testing
```bash
# Test frontend
curl -I https://capeembercoffee.co.za

# Test API
curl -I https://capeembercoffee.co.za/api/health

# Full health check
curl https://capeembercoffee.co.za/health
```

## Post-Deployment

- [ ] Monitor logs for errors: `docker-compose -f docker-compose.prod.yml logs -f`
- [ ] Verify all pages load correctly
- [ ] Test shopping cart functionality
- [ ] Test checkout process
- [ ] Verify email notifications working
- [ ] Check SSL certificate validity
- [ ] Setup log rotation
- [ ] Configure backup cron job
- [ ] Setup monitoring alerts
- [ ] Document deployment in runbook

## Backup Schedule Setup

```bash
# Create backups directory
mkdir -p /opt/cape-ember-coffee/backups

# Add to crontab (daily backup at 2 AM)
0 2 * * * /opt/cape-ember-coffee/capeembercoffee.co.za/scripts/backup.sh >> /var/log/cape-ember-backup.log 2>&1

# Add health check (every 5 minutes)
*/5 * * * * /opt/cape-ember-coffee/capeembercoffee.co.za/scripts/health-check.sh production >> /var/log/cape-ember-health.log 2>&1
```

## SSL Certificate Auto-Renewal

```bash
# Create renewal hook script
sudo cat > /etc/letsencrypt/renewal-hooks/post/cape-ember.sh << 'EOF'
#!/bin/bash
cp /etc/letsencrypt/live/capeembercoffee.co.za/fullchain.pem /opt/cape-ember-coffee/capeembercoffee.co.za/ssl/certs/cert.pem
cp /etc/letsencrypt/live/capeembercoffee.co.za/privkey.pem /opt/cape-ember-coffee/capeembercoffee.co.za/ssl/certs/key.pem
chown deploy:deploy /opt/cape-ember-coffee/capeembercoffee.co.za/ssl/certs/*
cd /opt/cape-ember-coffee/capeembercoffee.co.za
docker-compose -f docker-compose.prod.yml restart nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/post/cape-ember.sh

# Test renewal
sudo certbot renew --dry-run
```

## Rollback Procedure

If issues occur after deployment:

```bash
# 1. Check recent commits
git log --oneline -10

# 2. Identify problematic commit
git diff <previous-commit>..<current-commit>

# 3. Rollback
git checkout <previous-commit>
git reset --hard <previous-commit>

# 4. Rebuild and redeploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify
curl https://capeembercoffee.co.za/health
```

## Monitoring Endpoints

- **Frontend**: https://capeembercoffee.co.za
- **API Docs**: https://capeembercoffee.co.za/api/docs
- **Health Check**: https://capeembercoffee.co.za/health
- **Nginx Logs**: `docker logs cape-ember-nginx-prod`
- **Backend Logs**: `docker logs cape-ember-backend-prod`
- **Frontend Logs**: `docker logs cape-ember-frontend-prod`

## Emergency Contacts

- **Deployment Issues**: deployment@capeembercoffee.co.za
- **Security Issues**: security@capeembercoffee.co.za
- **Server Admin**: admin@capeembercoffee.co.za

---

**Deployed On**: [Date]
**Deployed By**: [Person]
**Deployment Time**: [Time taken]
**Issues Encountered**: [None/List issues]
**Notes**: [Any additional notes]
