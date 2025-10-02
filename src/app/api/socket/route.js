const { NextRequest } = require('next/server');
const { getSocketManager } = require('../../lib/socket/SocketManager');

// This will be called from your Next.js server setup
function initializeSocketIO(server) {
  const socketManager = getSocketManager();
  return socketManager.initialize(server);
}

// Health check endpoint for Socket.IO
async function GET(request) {
  const socketManager = getSocketManager();

  return Response.json({
    status: 'ok',
    activeUsers: socketManager.getActiveUsersCount(),
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  initializeSocketIO,
  GET
};

