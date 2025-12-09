# Deployment Guide - OS Escape (Including Round 2)

## Overview
This guide covers deploying the OS Escape application with both Round 1 (File System) and Round 2 (Banker's Algorithm) to production environments.

## Table of Contents
1. [Local Deployment](#local-deployment)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Nginx Configuration](#nginx-configuration)

---

## Local Deployment

### Prerequisites
- Node.js v14 or higher
- MongoDB v4.4 or higher
- Git

### Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd OS
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Set environment variables
   export MONGO_URI="mongodb://localhost:27017/os-escape"
   export PORT=5000
   
   # Start server
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run build
   npm run preview
   ```

4. **Access Application**
   - Frontend: http://localhost:4173
   - Backend API: http://localhost:5000

---

## Docker Deployment

### Backend Dockerfile
Create `backend/Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### Frontend Dockerfile
Create `frontend/Dockerfile`:

```dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: os-escape-mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: os-escape

  backend:
    build: ./backend
    container_name: os-escape-backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongodb:27017/os-escape
      - PORT=5000
      - NODE_ENV=production
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    container_name: os-escape-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Deploy with Docker Compose
```bash
docker-compose up -d
```

---

## Cloud Deployment

### Option 1: Heroku

#### Backend Deployment
```bash
cd backend
heroku create os-escape-backend
heroku addons:create mongolab:sandbox
git push heroku master
```

#### Frontend Deployment
```bash
cd frontend
# Update API endpoint in src/services/api.js
# Change baseURL to your Heroku backend URL
npm run build

# Deploy to Netlify, Vercel, or Heroku
```

### Option 2: AWS

#### Backend (EC2)
1. Launch EC2 instance (Ubuntu 20.04)
2. Install Node.js and MongoDB
3. Clone repository and install dependencies
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name os-escape-backend
   pm2 startup
   pm2 save
   ```

#### Frontend (S3 + CloudFront)
1. Build frontend: `npm run build`
2. Upload `dist` folder to S3 bucket
3. Configure CloudFront distribution
4. Update API endpoint to backend URL

### Option 3: DigitalOcean

#### Using App Platform
1. Connect GitHub repository
2. Configure two components:
   - Backend (Node.js)
   - Frontend (Static Site)
3. Add MongoDB managed database
4. Deploy

#### Manual Droplet Setup
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install dependencies
apt update
apt install -y nodejs npm mongodb nginx

# Clone and setup
git clone <repo-url>
cd OS

# Backend
cd backend
npm install
pm2 start server.js

# Frontend
cd frontend
npm install
npm run build
cp -r dist/* /var/www/html/
```

---

## Environment Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb://localhost:27017/os-escape

# Security (optional)
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Frontend Environment Variables

Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

Update `frontend/src/services/api.js`:
```javascript
const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});
```

---

## Database Setup

### MongoDB Atlas (Cloud)

1. **Create Cluster**
   - Sign up at mongodb.com/cloud/atlas
   - Create free tier cluster
   - Note connection string

2. **Configure Access**
   - Add IP addresses to whitelist
   - Create database user
   - Get connection string

3. **Update Backend**
   ```javascript
   // In backend/server.js or .env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/os-escape
   ```

### Local MongoDB

```bash
# Install MongoDB
# Ubuntu
sudo apt install -y mongodb

# macOS
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongodb
# or
brew services start mongodb-community

# Verify
mongo
> use os-escape
> db.stats()
```

### Seed Database (Optional)

```bash
cd backend
npm run seed
```

---

## Nginx Configuration

### Reverse Proxy Setup

Create `/etc/nginx/sites-available/os-escape`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/os-escape/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/os-escape /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL Configuration (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Production Checklist

### Security
- [ ] Use HTTPS (SSL certificate)
- [ ] Set strong JWT/session secrets
- [ ] Enable CORS only for specific origins
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Add helmet.js for security headers

### Performance
- [ ] Enable gzip compression
- [ ] Minify frontend assets
- [ ] Use CDN for static assets
- [ ] Implement database indexing
- [ ] Add Redis for session storage (optional)
- [ ] Enable browser caching

### Monitoring
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure uptime monitoring
- [ ] Monitor database performance
- [ ] Set up alerts for downtime
- [ ] Implement analytics (optional)

### Backup
- [ ] Regular database backups
- [ ] Backup strategy documentation
- [ ] Test restore procedures

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy, AWS ELB)
- Multiple backend instances
- Shared session store (Redis)
- Database replication

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add database indexes
- Implement caching

---

## Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check logs
pm2 logs os-escape-backend

# Check port
lsof -i :5000

# Check MongoDB connection
mongo --eval "db.stats()"
```

**Frontend API errors**
- Verify CORS configuration
- Check API URL in frontend config
- Inspect browser network tab
- Verify backend is accessible

**Database connection failed**
- Check MongoDB is running
- Verify connection string
- Check firewall rules
- Verify IP whitelist (MongoDB Atlas)

---

## Maintenance

### Regular Tasks
- Update dependencies: `npm update`
- Monitor disk space
- Review error logs
- Database optimization
- Security updates

### Backup Commands
```bash
# Backup MongoDB
mongodump --db os-escape --out /backup/$(date +%Y%m%d)

# Restore MongoDB
mongorestore --db os-escape /backup/20240101/os-escape
```

---

## Support Resources

- Node.js Documentation: https://nodejs.org/docs
- MongoDB Documentation: https://docs.mongodb.com
- React Documentation: https://react.dev
- Express Documentation: https://expressjs.com

---

## Version Information

- Node.js: v16+
- MongoDB: v5.0+
- React: v18.2
- Express: v4.18

Last Updated: December 2024
