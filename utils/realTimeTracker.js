const io = require('socket.io')(server);

const trackRealTime = (socketId) => {
    io.to(socketId).emit('update', { message: 'Real-time update' });
};

module.exports = {
    trackRealTime,
};