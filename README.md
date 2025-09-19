# EcoComfort v2 - NestJS Backend

> 🏠 IoT energy monitoring system with simplified ESP8266 door sensor and RuuviTag climate sensors

## 🚀 Quick Start

### Prerequisites
- Node.js 22 LTS
- Docker & Docker Compose
- Git

### Setup
```bash
# Clone repository
git clone <your-repo-url>
cd ecocomfort-v2

# Start PostgreSQL
cd backend
docker-compose up -d

# Backend setup
npm install
npm run start:dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

## 📡 Architecture

```
ESP8266 (Door) → MQTT → NestJS → PostgreSQL
                           ↓
3x RuuviTag → MQTT → Parser → Energy Calculator
                           ↓
                      Socket.io → React Frontend
```

## 🔌 MQTT Topics

- **Door**: `sensor/door_sensor/RESULT` → `{"Switch1": {"Action": "ON/OFF"}}`
- **RuuviTag**: `pws-packet/202481598160802/{944372022|422801533|1947698524}`

## 🛠️ Tech Stack

### Backend
- **NestJS 10** + TypeScript
- **PostgreSQL** (Docker)
- **TypeORM** (entities + migrations)
- **Socket.io** (real-time)
- **MQTT** (sensors)
- **JWT** (auth)
- **Jest** (tests)

### Frontend
- **React** + TypeScript
- **Vite** (build)
- **Tailwind CSS**
- **Socket.io client**

## 📊 Features

- ✅ Real-time door state detection (ESP8266)
- ✅ Climate monitoring (3x RuuviTag)
- ✅ Energy loss calculations (OpenWeather API)
- ✅ Simple gamification (points/badges)
- ✅ WebSocket live updates
- ✅ Simplified authentication

## 🧪 Development

```bash
# Backend tests
cd backend
npm run test
npm run test:watch
npm run test:cov

# Start services
npm run start:dev    # Backend on :3000
cd frontend && npm run dev  # Frontend on :5173

# Database
docker-compose up postgres
```

## 📈 Project Status

**Target**: RNCP Level 6 demonstration
**Duration**: 3 days implementation
**Complexity**: ~800 lines backend + tests

### Progress
- [x] Day 1: Core infrastructure setup
- [ ] Day 2: Business logic implementation
- [ ] Day 3: Integration & testing

## 🎯 Simplifications vs Laravel Version

- ❌ No Kalman filter (ESP8266 contact sensor)
- ❌ No complex calibration
- ❌ No multi-tenant
- ❌ No over-engineered patterns
- ✅ Simple door ON/OFF detection
- ✅ Direct energy calculations
- ✅ Pragmatic architecture

## 📚 Documentation

See `globalSpecs.md` for complete technical specifications and roadmap.