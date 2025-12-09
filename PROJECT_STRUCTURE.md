# OS Escape - Complete Project Structure

```
OS/
│
├── 📄 README.md                          # Main project documentation
├── 📄 ROUND2_README.md                   # Round 2 detailed documentation
├── 📄 QUICK_START_ROUND2.md              # Quick start guide for Round 2
├── 📄 DEPLOYMENT_GUIDE.md                # Production deployment guide
├── 📄 VISUAL_REFERENCE_ROUND2.md         # Visual problem reference
├── 📄 IMPLEMENTATION_SUMMARY.md          # Summary of what was built
│
├── 📁 backend/                           # Backend server
│   │
│   ├── 📄 package.json                   # Backend dependencies
│   ├── 📄 server.js                      # Main server (MODIFIED ✏️)
│   │
│   ├── 📁 config/
│   │   └── 📄 db.js                      # Database configuration
│   │
│   ├── 📁 engine/                        # Business logic engines
│   │   ├── 📄 commandEngine.js           # Round 1: Terminal commands
│   │   ├── 📄 bankersEngine.js           # Round 2: Banker's Algorithm (NEW ✨)
│   │   └── 📄 helper.js                  # Helper functions
│   │
│   ├── 📁 models/                        # MongoDB models
│   │   ├── 📄 User.js                    # User model
│   │   ├── 📄 Session.js                 # Session model
│   │   ├── 📄 FileNode.js                # Round 1: File system nodes
│   │   └── 📄 Round2State.js             # Round 2: Game state (NEW ✨)
│   │
│   ├── 📁 routes/                        # API routes
│   │   ├── 📄 auth.js                    # Authentication (Shared)
│   │   ├── 📄 terminal.js                # Round 1: Terminal API
│   │   └── 📄 bankers.js                 # Round 2: Banker's API (NEW ✨)
│   │
│   └── 📁 seed/                          # Database seeding
│       ├── 📄 seed.js                    # Seed script
│       └── 📄 filesystemSeed.json        # Round 1 data
│
├── 📁 frontend/                          # Frontend application
│   │
│   ├── 📄 package.json                   # Frontend dependencies
│   ├── 📄 index.html                     # HTML entry point
│   │
│   └── 📁 src/
│       │
│       ├── 📄 main.jsx                   # React entry point
│       ├── 📄 App.jsx                    # Main app component (MODIFIED ✏️)
│       ├── 📄 styles.css                 # Main styles (MODIFIED ✏️)
│       │
│       ├── 📁 components/                # React components
│       │   ├── 📄 Login.jsx              # Login component (Shared)
│       │   ├── 📄 Cheatsheet.jsx         # Round 1: Command cheatsheet
│       │   ├── 📄 Terminal.jsx           # Round 1: Terminal UI
│       │   └── 📄 BankersAlgorithm.jsx   # Round 2: Main UI (NEW ✨)
│       │
│       ├── 📁 services/                  # API services
│       │   └── 📄 api.js                 # API client (MODIFIED ✏️)
│       │
│       └── 📁 styles/                    # Component styles
│           └── 📄 bankers.css            # Round 2 styles (NEW ✨)
│
└── 📁 .git/                              # Git repository
```

## 🎯 Key Files by Feature

### Round 1 (File System) - Existing
```
Backend:
  - engine/commandEngine.js
  - models/FileNode.js
  - routes/terminal.js
  
Frontend:
  - components/Terminal.jsx
  - components/Cheatsheet.jsx
```

### Round 2 (Banker's Algorithm) - NEW ✨
```
Backend:
  - engine/bankersEngine.js       ⭐ Core algorithm
  - models/Round2State.js          ⭐ State management
  - routes/bankers.js              ⭐ API endpoints

Frontend:
  - components/BankersAlgorithm.jsx  ⭐ Main UI
  - styles/bankers.css               ⭐ Styling
```

### Shared Infrastructure
```
Backend:
  - server.js                      🔗 Router
  - routes/auth.js                 🔗 Authentication
  - models/User.js                 🔗 User management
  - models/Session.js              🔗 Session tracking
  - config/db.js                   🔗 Database

Frontend:
  - App.jsx                        🔗 Navigation & routing
  - components/Login.jsx           🔗 Login UI
  - services/api.js                🔗 API client
```

### Documentation 📚
```
README.md                     # Main overview
ROUND2_README.md              # Round 2 details
QUICK_START_ROUND2.md         # Getting started
DEPLOYMENT_GUIDE.md           # Production deployment
VISUAL_REFERENCE_ROUND2.md    # Problem visualization
IMPLEMENTATION_SUMMARY.md     # Build summary
```

## 📊 File Statistics

### Total Files
- **Backend**: 11 files (3 new, 1 modified)
- **Frontend**: 10 files (2 new, 3 modified)
- **Documentation**: 6 files (5 new, 1 modified)
- **Total**: 27 files

### New Files Created (11)
1. backend/engine/bankersEngine.js
2. backend/models/Round2State.js
3. backend/routes/bankers.js
4. frontend/src/components/BankersAlgorithm.jsx
5. frontend/src/styles/bankers.css
6. ROUND2_README.md
7. QUICK_START_ROUND2.md
8. DEPLOYMENT_GUIDE.md
9. VISUAL_REFERENCE_ROUND2.md
10. IMPLEMENTATION_SUMMARY.md
11. PROJECT_STRUCTURE.md (this file)

### Modified Files (5)
1. backend/server.js (added Round 2 routes)
2. frontend/src/App.jsx (added navigation)
3. frontend/src/services/api.js (added Round 2 APIs)
4. frontend/src/styles.css (added menu styles)
5. README.md (updated documentation)

## 🎨 Component Hierarchy

```
App
├── Login                          (if not authenticated)
│
├── Round Selection Menu           (if authenticated)
│   ├── Round 1 Card
│   ├── Round 2 Card
│   └── Round 3 Card (locked)
│
├── Round 1 View
│   ├── Terminal
│   └── Cheatsheet
│
└── Round 2 View
    └── BankersAlgorithm
        ├── Process Nodes Grid
        ├── Resource Cards
        ├── Request Panel
        ├── Safety Analysis
        ├── Action History
        └── Control Buttons
```

## 🗄️ Database Collections

```
MongoDB: os-escape
│
├── users                    # User accounts
├── sessions                 # User sessions (shared)
├── filenodes               # Round 1: File system
└── round2states            # Round 2: Game state (NEW ✨)
```

## 🔄 API Routes

```
/api
├── /auth                   # Authentication (Shared)
│   ├── POST /login
│   └── GET /session/:id
│
├── /terminal               # Round 1
│   └── POST /exec
│
└── /bankers                # Round 2 (NEW ✨)
    ├── POST /initialize
    ├── GET /state/:sessionId
    ├── POST /check-safety
    ├── POST /request
    ├── POST /release
    ├── POST /reset
    └── POST /complete
```

## 🎯 Data Flow

### Round 2 Request Flow
```
User Action (UI)
    ↓
BankersAlgorithm.jsx
    ↓
api.js (axios)
    ↓
/api/bankers/* (Express route)
    ↓
bankersEngine.js (Business logic)
    ↓
Round2State.js (MongoDB model)
    ↓
MongoDB Database
    ↓
Response back through chain
    ↓
UI Update
```

## 🎨 CSS Organization

```
Styles
│
├── styles.css              # Global styles + Round 1
│   ├── Terminal styles
│   ├── Login styles
│   └── Round menu styles (NEW ✏️)
│
└── bankers.css             # Round 2 specific (NEW ✨)
    ├── Container & layout
    ├── Process nodes
    ├── Resource cards
    ├── Request panel
    ├── Safety display
    ├── History viewer
    └── Responsive media queries
```

## 🚀 Deployment Structure

```
Production Environment
│
├── Frontend Server (Port 80/443)
│   └── Nginx serving static files
│
├── Backend Server (Port 5000)
│   └── Node.js + Express
│
└── Database Server (Port 27017)
    └── MongoDB
```

## 📦 Dependencies

### Backend (package.json)
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "cors": "^2.8.5",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0"
}
```

### Frontend (package.json)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.3.4",
  "vite": "^4.0.0"
}
```

## 🔍 Quick File Locator

**Need to modify...**
- Algorithm logic? → `backend/engine/bankersEngine.js`
- API endpoints? → `backend/routes/bankers.js`
- Database schema? → `backend/models/Round2State.js`
- UI layout? → `frontend/src/components/BankersAlgorithm.jsx`
- Styling? → `frontend/src/styles/bankers.css`
- Navigation? → `frontend/src/App.jsx`
- API calls? → `frontend/src/services/api.js`

## ✅ Verification Checklist

- [x] All backend files created
- [x] All frontend files created
- [x] All documentation files created
- [x] Server.js modified correctly
- [x] App.jsx modified correctly
- [x] API service updated
- [x] Styles updated
- [x] No syntax errors
- [x] Proper file organization
- [x] Complete documentation

---

**Project Status: ✅ COMPLETE & READY FOR DEPLOYMENT**

Last Updated: December 2024
