Quantum-Secure Chat (QKD Simulation)

Monorepo with Express + Socket.IO backend and Vite React + Tailwind frontend. BB84 QKD simulation generates keys for AES-GCM encryption of chat messages.

Structure
- backend/ (TypeScript Express, MongoDB, Socket.IO)
- frontend/ (Vite React, Tailwind, Socket.IO client)
- db/ (notes)

Setup
1. Prereqs: Node 18+, MongoDB running locally (or set MONGO_URI).
2. Backend:
   - Create backend/.env with PORT, MONGO_URI, JWT_SECRET (see below).
   - cd backend && npm i && npm run dev
3. Frontend:
   - Create frontend/.env with VITE_API_BASE and VITE_WS_BASE.
   - cd frontend && npm i && npm run dev

Env examples
backend/.env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/quantum_chat
JWT_SECRET=change_me

frontend/.env
VITE_API_BASE=http://localhost:4000
VITE_WS_BASE=http://localhost:4000

Features
- Sign up / Login (JWT)
- Start chat by entering peer userId
- Run BB84 simulation (with optional Eve) → shared key
- AES-GCM encrypt/decrypt messages on client; store ciphertext on server
- Real-time updates via Socket.IO

Notes
- BB84 simplified for demo. Eve detection threshold QBER > 11%.
- Add more protocols in backend/src/qkd/* and expose routes.


