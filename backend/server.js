const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const path = require('path');
// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
connectDB();

// Socket.io Setup
const { initSocket } = require('./config/socket');
const io = initSocket(server);

// Global Socket Instance
global.io = io;

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/promoter', require('./routes/promoterRoutes'));
app.use('/api/scores', require('./routes/scoreRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/communication', require('./routes/communicationRoutes'));
app.use('/api/admin/content', require('./routes/pageContentRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/admin/emails', require('./routes/emailRoutes'));

app.get('/', (req, res) => {
    res.send('Travel Web App Backend Running');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server Error' });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
