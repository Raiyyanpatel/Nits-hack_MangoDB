const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // In production, specify exact origins
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store connected clients
const connectedClients = new Map();

// Store citizen locations
const citizenLocations = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

// REST endpoint to broadcast alert (for testing)
app.post('/api/broadcast-alert', (req, res) => {
  const alert = req.body;
  
  console.log('📢 Broadcasting alert via REST API:', alert.title);
  
  // Broadcast to all connected clients
  io.emit('disaster-alert', alert);
  
  res.json({
    success: true,
    message: 'Alert broadcasted successfully',
    recipientCount: connectedClients.size,
    alert
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);
  
  // Store client info
  connectedClients.set(socket.id, {
    id: socket.id,
    connectedAt: new Date(),
    userRole: null,
    userId: null
  });

  // Log current connections
  console.log(`📊 Total connected clients: ${connectedClients.size}`);

  // Handle user registration
  socket.on('register', (data) => {
    console.log('👤 User registered:', data);
    
    const clientInfo = connectedClients.get(socket.id);
    if (clientInfo) {
      clientInfo.userId = data.userId;
      clientInfo.userRole = data.role;
      clientInfo.userName = data.userName;
      connectedClients.set(socket.id, clientInfo);
    }

    // Send confirmation
    socket.emit('registered', {
      success: true,
      socketId: socket.id,
      message: 'Successfully registered with server'
    });
  });

  // Handle disaster alert broadcast from officials
  socket.on('broadcast-alert', (alert) => {
    console.log('🚨 Broadcasting disaster alert:', alert.title);
    console.log('   Severity:', alert.severity);
    console.log('   Type:', alert.type);
    console.log('   Recipients:', connectedClients.size);

    // Add metadata
    const enrichedAlert = {
      ...alert,
      id: alert.id || `alert-${Date.now()}`,
      broadcastedAt: new Date().toISOString(),
      broadcastedBy: connectedClients.get(socket.id)?.userId || 'unknown'
    };

    // Broadcast to all connected clients
    io.emit('disaster-alert', enrichedAlert);

    // Send confirmation to sender
    socket.emit('alert-broadcasted', {
      success: true,
      alert: enrichedAlert,
      recipientCount: connectedClients.size - 1 // Exclude sender
    });

    console.log('✅ Alert broadcasted successfully');
  });

  // Handle SOS alerts
  socket.on('send-sos', (sosData) => {
    console.log('🆘 SOS alert received from:', sosData.userId);

    const enrichedSOS = {
      ...sosData,
      id: sosData.id || `sos-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    // Broadcast SOS to all officials
    io.emit('sos-alert', enrichedSOS);

    socket.emit('sos-sent', {
      success: true,
      sos: enrichedSOS
    });

    console.log('✅ SOS broadcasted to all officials');
  });

  // Handle incident reports
  socket.on('report-incident', (report) => {
    console.log('📝 Incident report received:', report.type);

    const enrichedReport = {
      ...report,
      id: report.id || `report-${Date.now()}`,
      submittedAt: new Date().toISOString()
    };

    // Broadcast to officials
    io.emit('new-incident-report', enrichedReport);

    socket.emit('report-submitted', {
      success: true,
      report: enrichedReport
    });
  });

  // Handle alert acknowledgment
  socket.on('acknowledge-alert', (data) => {
    console.log('✓ Alert acknowledged by:', data.userId);
    
    // Notify other users about acknowledgment
    socket.broadcast.emit('alert-acknowledged', {
      alertId: data.alertId,
      userId: data.userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle citizen location updates
  socket.on('citizen:location', (locationData) => {
    const timestamp = new Date().toISOString();
    console.log('\n═══════════════════════════════════════════════');
    console.log('📍 CITIZEN LOCATION UPDATE');
    console.log('═══════════════════════════════════════════════');
    console.log('👤 Citizen Name:', locationData.userName);
    console.log('🆔 User ID:', locationData.userId);
    console.log('🌍 Latitude:', locationData.latitude);
    console.log('🌍 Longitude:', locationData.longitude);
    console.log('📏 Accuracy:', locationData.accuracy, 'meters');
    console.log('⏰ Timestamp:', timestamp);
    console.log('🔗 Socket ID:', socket.id);
    console.log('═══════════════════════════════════════════════\n');
    
    // Store location with socket ID for cleanup
    citizenLocations.set(locationData.userId, {
      ...locationData,
      socketId: socket.id,
      lastUpdate: Date.now()
    });

    // Broadcast location to all connected clients (especially officials)
    io.emit('citizen:location:update', locationData);
  });

  // Handle official's request for all current locations
  socket.on('official:request:locations', () => {
    console.log('📤 Official requested all citizen locations');
    
    const allLocations = Array.from(citizenLocations.values()).map(loc => ({
      userId: loc.userId,
      userName: loc.userName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      timestamp: loc.timestamp
    }));

    socket.emit('official:all:locations', allLocations);
    console.log(`📤 Sent ${allLocations.length} citizen locations to official`);
  });

  // Handle typing indicators for chat (future feature)
  socket.on('typing', (data) => {
    socket.broadcast.emit('user-typing', {
      userId: data.userId,
      userName: data.userName
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const clientInfo = connectedClients.get(socket.id);
    console.log('❌ Client disconnected:', socket.id);
    
    if (clientInfo?.userName) {
      console.log('   User:', clientInfo.userName);
    }

    connectedClients.delete(socket.id);

    // Remove location if this was a citizen
    for (const [userId, data] of citizenLocations.entries()) {
      if (data.socketId === socket.id) {
        citizenLocations.delete(userId);
        console.log(`🗑️ Removed location for user: ${userId}`);
        break;
      }
    }

    console.log(`📊 Remaining clients: ${connectedClients.size}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('⚠️ Socket error:', error);
  });

  // Ping-pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Clean up stale locations every 5 minutes
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes

  for (const [userId, data] of citizenLocations.entries()) {
    if (now - data.lastUpdate > staleThreshold) {
      citizenLocations.delete(userId);
      console.log(`🗑️ Removed stale location for user: ${userId}`);
    }
  }
}, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  🚨 Disaster Management Server Started 🚨 ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.1.6:${PORT}`);
  console.log(`🔌 Socket.IO ready for connections`);
  console.log(`📡 Broadcasting enabled for disaster alerts`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
