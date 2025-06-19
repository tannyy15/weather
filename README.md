# Weather App

A full-stack weather application with a frontend client and Python backend API.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.7+
- pip (Python package manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/tannyy15/weather.git
cd weather
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
# or if you're using a virtual environment:
# pip install fastapi uvicorn
cd ..
```

## Running the Application

### Option 1: Manual Setup (Two Terminal Windows)

**Terminal 1 - Frontend:**
```bash
cd weather
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd weather/backend
uvicorn main:app --reload
```

### Option 2: Quick Start Script

Create a `start.sh` file in your project root:
```bash
#!/bin/bash
# Start frontend
cd weather
npm run dev &

# Start backend
cd backend
uvicorn main:app --reload &

# Wait for all background processes
wait
```

Make it executable and run:
```bash
chmod +x start.sh
./start.sh
```

## Default URLs

- **Frontend**: http://localhost:3000 (or port shown in terminal)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Development Notes

- The frontend will typically run on port 3000
- The backend API runs on port 8000 by default
- Both services support hot reload for development
- Make sure both services are running simultaneously for full functionality

## Common Commands

```bash
# Frontend development
cd weather
npm run dev
npm run build
npm run start

# Backend development
cd weather/backend
uvicorn main:app --reload
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Troubleshooting

- If ports are already in use, you can specify different ports:
  - Frontend: Check your package.json or framework documentation
  - Backend: `uvicorn main:app --reload --port 8001`
- Ensure all dependencies are installed before running
- Check that Python virtual environment is activated if using one
