const mongoose = require('mongoose');

// Fail fast on a bad write instead of queueing it forever while disconnected.
mongoose.set('bufferCommands', false);

async function connectDatabase(uri) {
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected.'));
    mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected.'));
    mongoose.connection.on('error', (error) => console.error('MongoDB error:', error.message));

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB connected (database: ${mongoose.connection.name}).`);
}

async function disconnectDatabase() {
    await mongoose.disconnect();
}

function isDatabaseReady() {
    return mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, disconnectDatabase, isDatabaseReady };
