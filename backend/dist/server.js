"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const auth_1 = __importDefault(require("./routes/auth"));
const qkd_1 = __importDefault(require("./routes/qkd"));
const messages_1 = __importDefault(require("./routes/messages"));
const rooms_1 = __importDefault(require("./routes/rooms"));
const users_1 = __importDefault(require("./routes/users"));
const socket_1 = require("./ws/socket");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/test', (_req, res) => res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() }));
app.use('/api/auth', auth_1.default);
app.use('/api/qkd', qkd_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/rooms', rooms_1.default);
app.use('/api/users', users_1.default);
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
(0, socket_1.registerSocketHandlers)(io);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quantum_chat';
const PORT = Number(process.env.PORT || 4000);
async function start() {
    console.log('[startup] Connecting to MongoDB...');
    mongoose_1.default.connection.on('connected', () => console.log('[mongo] connected'));
    mongoose_1.default.connection.on('error', (err) => console.error('[mongo] error', err));
    mongoose_1.default.connection.on('disconnected', () => console.warn('[mongo] disconnected'));
    await mongoose_1.default.connect(MONGO_URI);
    console.log(`[startup] Mongo connected at ${MONGO_URI.split('@').pop()}`);
    server.listen(PORT, () => console.log(`[startup] Backend listening on :${PORT}`));
}
start().catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
});
