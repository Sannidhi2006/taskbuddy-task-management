import mongoose from 'mongoose';

/**
 * Health check controller
 * Checks server responsiveness and MongoDB connection state.
 */
export const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'ok',
    app: 'TaskBuddy Backend',
    motto: 'Your friendly task manager',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatus,
    },
  });
};
