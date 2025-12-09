# Testing & Deployment Checklist for Round 2

## 🧪 Pre-Deployment Testing

### ✅ Backend Testing

#### 1. Server Startup
```powershell
cd backend
npm install
npm start
```
- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] All routes registered
- [ ] Port 5000 listening

#### 2. API Endpoint Testing

Use Postman, curl, or browser:

**Initialize Round 2:**
```bash
POST http://localhost:5000/api/bankers/initialize
Body: { "sessionId": "test123" }
```
- [ ] Returns 200 status
- [ ] Returns initial state
- [ ] Creates Round2State in database

**Get State:**
```bash
GET http://localhost:5000/api/bankers/state/test123
```
- [ ] Returns current state
- [ ] Shows processes, resources, allocation, etc.

**Check Safety:**
```bash
POST http://localhost:5000/api/bankers/check-safety
Body: { "sessionId": "test123" }
```
- [ ] Returns safe/unsafe status
- [ ] Shows safe sequence if safe
- [ ] Updates score

**Request Resources:**
```bash
POST http://localhost:5000/api/bankers/request
Body: {
  "sessionId": "test123",
  "processIndex": 1,
  "request": [1, 2, 2, 2]
}
```
- [ ] Validates request
- [ ] Checks safety
- [ ] Updates state if granted
- [ ] Adds to history

#### 3. Database Verification
```bash
mongo
use os-escape
db.round2states.find().pretty()
```
- [ ] Round2State documents created
- [ ] All fields populated correctly
- [ ] History array logging actions

---

### ✅ Frontend Testing

#### 1. Development Server
```powershell
cd frontend
npm install
npm run dev
```
- [ ] Vite starts without errors
- [ ] Opens http://localhost:5173
- [ ] No console errors

#### 2. Navigation Flow
- [ ] Login page loads
- [ ] Can log in with username
- [ ] Round selection menu appears
- [ ] Can navigate to Round 1
- [ ] Can navigate to Round 2
- [ ] Back button works
- [ ] Logout works
- [ ] Session persists on refresh

#### 3. Round 2 UI Components

**Process Nodes:**
- [ ] All 7 processes display (P0-P6)
- [ ] Allocation shown correctly
- [ ] Max shown correctly
- [ ] Need calculated correctly
- [ ] Click selects process
- [ ] Selected process highlighted
- [ ] Active processes marked

**Resources:**
- [ ] All 4 resources display (A, B, C, D)
- [ ] Total shown correctly
- [ ] Available shown correctly
- [ ] Allocated calculated correctly
- [ ] Resource cards styled properly

**Request Panel:**
- [ ] Shows selected process
- [ ] Input fields for each resource
- [ ] Can enter numbers
- [ ] Request button works
- [ ] Disabled when no process selected

**Safety Analysis:**
- [ ] Check Safety button works
- [ ] Shows safe/unsafe status
- [ ] Displays safe sequence
- [ ] Shows execution log
- [ ] Color coding correct

**History:**
- [ ] Show/Hide button works
- [ ] Actions logged
- [ ] Timestamps shown
- [ ] Granted/denied marked
- [ ] Scrollable list

#### 4. Functionality Testing

**Test Case 1: Safe Request**
1. Select process P1
2. Request [1, 2, 2, 2]
3. Expected: Granted
- [ ] Request granted
- [ ] Allocation updated
- [ ] Available decreased
- [ ] Score increased
- [ ] History logged

**Test Case 2: Unsafe Request**
1. Select process P0
2. Request [3, 3, 2, 2]
3. Expected: Denied (leads to unsafe state)
- [ ] Request denied
- [ ] State unchanged
- [ ] Reason shown
- [ ] History logged

**Test Case 3: Invalid Request**
1. Select process P1
2. Request [5, 5, 5, 5] (exceeds need)
3. Expected: Denied
- [ ] Request denied
- [ ] Error message shown
- [ ] State unchanged

**Test Case 4: Check Safety**
1. Click "Check Safety"
- [ ] Shows current safety status
- [ ] Shows safe sequence
- [ ] Shows execution log
- [ ] Score updated

**Test Case 5: Reset**
1. Make some requests
2. Click "Reset Round"
- [ ] Confirms reset
- [ ] Returns to initial state
- [ ] Clears history
- [ ] Resets score

---

### ✅ Responsive Design Testing

#### Desktop (1920x1080)
- [ ] Layout looks good
- [ ] All elements visible
- [ ] No horizontal scroll
- [ ] Process nodes in grid
- [ ] Resource cards in row

#### Tablet (768x1024)
- [ ] Layout adapts
- [ ] Readable text
- [ ] Buttons accessible
- [ ] Grid adjusts

#### Mobile (375x667)
- [ ] Single column layout
- [ ] Process nodes stack
- [ ] Resource cards stack
- [ ] Touch targets adequate
- [ ] No overlap

---

### ✅ Cross-Browser Testing

#### Chrome
- [ ] All features work
- [ ] CSS renders correctly
- [ ] Animations smooth

#### Firefox
- [ ] All features work
- [ ] CSS renders correctly
- [ ] No console errors

#### Safari
- [ ] All features work
- [ ] CSS renders correctly
- [ ] iOS compatibility

#### Edge
- [ ] All features work
- [ ] CSS renders correctly
- [ ] No issues

---

### ✅ Error Handling

#### Backend Errors
- [ ] Invalid sessionId handled
- [ ] Missing fields handled
- [ ] Database errors caught
- [ ] Appropriate status codes

#### Frontend Errors
- [ ] API errors shown to user
- [ ] Network errors handled
- [ ] Loading states shown
- [ ] Error messages clear

#### Edge Cases
- [ ] Request [0,0,0,0] handled
- [ ] Negative numbers prevented
- [ ] Very large numbers handled
- [ ] Special characters rejected

---

### ✅ Performance Testing

#### Load Time
- [ ] Page loads under 2s
- [ ] API responses under 500ms
- [ ] Smooth animations
- [ ] No lag on interactions

#### Memory
- [ ] No memory leaks
- [ ] Reasonable memory usage
- [ ] History doesn't overflow

---

## 🚀 Deployment Checklist

### Pre-Deployment

#### Code Review
- [ ] All files committed to git
- [ ] No console.log in production
- [ ] No hardcoded credentials
- [ ] Environment variables used
- [ ] Comments added where needed

#### Configuration
- [ ] backend/.env configured
- [ ] frontend/.env.production configured
- [ ] API URLs point to production
- [ ] CORS origins set correctly
- [ ] MongoDB URI updated

#### Build Testing
```powershell
# Frontend production build
cd frontend
npm run build
npm run preview
```
- [ ] Build succeeds
- [ ] No warnings
- [ ] Preview works
- [ ] Assets optimized

---

### Deployment Steps

#### Option A: Docker Deployment

1. **Build Images**
```powershell
docker-compose build
```
- [ ] Backend image builds
- [ ] Frontend image builds
- [ ] MongoDB ready

2. **Start Services**
```powershell
docker-compose up -d
```
- [ ] All containers start
- [ ] Services healthy
- [ ] Can access application

3. **Verify**
- [ ] Frontend accessible
- [ ] Backend responding
- [ ] Database connected
- [ ] Round 2 works

#### Option B: Manual Deployment

1. **Deploy Backend**
```bash
# On server
git clone <repo>
cd backend
npm install --production
npm start
```
- [ ] Backend running
- [ ] MongoDB connected
- [ ] Port accessible

2. **Deploy Frontend**
```bash
cd frontend
npm install
npm run build
# Copy dist/ to web server
```
- [ ] Static files served
- [ ] API connected
- [ ] Assets loading

3. **Configure Reverse Proxy**
```nginx
# Nginx config
server {
    listen 80;
    location / { ... }
    location /api { ... }
}
```
- [ ] Nginx configured
- [ ] SSL enabled
- [ ] Redirects work

---

### Post-Deployment

#### Smoke Tests
- [ ] Can access homepage
- [ ] Can log in
- [ ] Can select Round 2
- [ ] Can initialize game
- [ ] Can make requests
- [ ] Can check safety
- [ ] Score updates
- [ ] No console errors

#### Monitoring Setup
- [ ] Error logging enabled
- [ ] Uptime monitoring
- [ ] Performance tracking
- [ ] Database backups scheduled

#### Documentation
- [ ] Deployment documented
- [ ] Credentials secured
- [ ] Team notified
- [ ] User guide available

---

## 🔍 Troubleshooting Guide

### Issue: Backend won't start
**Check:**
- [ ] MongoDB running?
- [ ] Port 5000 available?
- [ ] Dependencies installed?
- [ ] Environment variables set?

**Solution:**
```powershell
# Check MongoDB
mongo --eval "db.stats()"

# Check port
netstat -ano | findstr :5000

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Frontend can't connect to backend
**Check:**
- [ ] Backend URL correct?
- [ ] CORS enabled?
- [ ] Network accessible?
- [ ] Firewall rules?

**Solution:**
- Update VITE_API_URL
- Check backend CORS settings
- Test with curl/Postman

### Issue: Request denied unexpectedly
**Check:**
- [ ] Request exceeds Need?
- [ ] Sufficient Available?
- [ ] Would create unsafe state?

**Solution:**
- Check execution log
- Review Need matrix
- Verify Available resources

---

## 📊 Success Metrics

### Functionality
- [x] All API endpoints working
- [x] All UI components functional
- [x] Algorithm correctness verified
- [x] Error handling robust

### Performance
- [ ] Page load < 2s
- [ ] API response < 500ms
- [ ] No UI lag
- [ ] Smooth animations

### Quality
- [x] No console errors
- [x] Responsive design works
- [x] Cross-browser compatible
- [x] Well documented

### User Experience
- [x] Intuitive interface
- [x] Clear feedback
- [x] Educational value
- [x] Engaging gameplay

---

## ✅ Final Sign-Off

- [ ] All tests passed
- [ ] Documentation complete
- [ ] Deployment successful
- [ ] Team trained
- [ ] Users notified
- [ ] Monitoring active

**Deployment Date:** _______________
**Deployed By:** _______________
**Status:** _______________

---

**Notes:**
- Keep this checklist for future deployments
- Update as new issues discovered
- Share learnings with team
- Celebrate success! 🎉
