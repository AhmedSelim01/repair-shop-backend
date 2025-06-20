
const WebSocket = require('ws');
const logger = require('../config/logger');
const JobCard = require('../models/JobCard');
const Truck = require('../models/Truck');

class RealTimeTracker {
    constructor() {
        this.connections = new Map(); // userId -> WebSocket connection
        this.truckLocations = new Map(); // truckId -> location data
        this.jobCardUpdates = new Map(); // jobCardId -> update data
        this.wsServer = null;
    }

    // Initialize WebSocket server
    initialize(server) {
        this.wsServer = new WebSocket.Server({ server });
        
        this.wsServer.on('connection', (ws, req) => {
            logger.info('New WebSocket connection established');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(ws, data);
                } catch (error) {
                    logger.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({ error: 'Invalid message format' }));
                }
            });

            ws.on('close', () => {
                this.removeConnection(ws);
                logger.info('WebSocket connection closed');
            });

            ws.on('error', (error) => {
                logger.error('WebSocket error:', error);
                this.removeConnection(ws);
            });
        });

        logger.info('Real-time tracker initialized');
    }

    // Handle incoming WebSocket messages
    async handleMessage(ws, data) {
        const { type, payload } = data;

        switch (type) {
            case 'auth':
                await this.authenticateConnection(ws, payload);
                break;
            
            case 'subscribe_truck':
                this.subscribeToTruck(ws, payload.truckId);
                break;
            
            case 'subscribe_jobcard':
                this.subscribeToJobCard(ws, payload.jobCardId);
                break;
            
            case 'truck_location':
                await this.updateTruckLocation(payload);
                break;
            
            case 'jobcard_progress':
                await this.updateJobCardProgress(payload);
                break;
            
            default:
                ws.send(JSON.stringify({ error: 'Unknown message type' }));
        }
    }

    // Authenticate WebSocket connection
    async authenticateConnection(ws, payload) {
        const { userId, token } = payload;
        
        try {
            // Verify JWT token (simplified for demo)
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.id === userId) {
                ws.userId = userId;
                this.connections.set(userId, ws);
                
                ws.send(JSON.stringify({
                    type: 'auth_success',
                    message: 'Authentication successful'
                }));
                
                logger.info(`User ${userId} authenticated via WebSocket`);
            } else {
                ws.send(JSON.stringify({
                    type: 'auth_error',
                    message: 'Invalid token'
                }));
            }
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'auth_error',
                message: 'Authentication failed'
            }));
        }
    }

    // Subscribe to truck location updates
    subscribeToTruck(ws, truckId) {
        if (!ws.userId) {
            ws.send(JSON.stringify({ error: 'Authentication required' }));
            return;
        }

        ws.subscribedTrucks = ws.subscribedTrucks || new Set();
        ws.subscribedTrucks.add(truckId);
        
        // Send current location if available
        const currentLocation = this.truckLocations.get(truckId);
        if (currentLocation) {
            ws.send(JSON.stringify({
                type: 'truck_location_update',
                data: { truckId, ...currentLocation }
            }));
        }

        logger.info(`User ${ws.userId} subscribed to truck ${truckId}`);
    }

    // Subscribe to job card progress updates
    subscribeToJobCard(ws, jobCardId) {
        if (!ws.userId) {
            ws.send(JSON.stringify({ error: 'Authentication required' }));
            return;
        }

        ws.subscribedJobCards = ws.subscribedJobCards || new Set();
        ws.subscribedJobCards.add(jobCardId);
        
        logger.info(`User ${ws.userId} subscribed to job card ${jobCardId}`);
    }

    // Update truck location (from IoT devices or mobile app)
    async updateTruckLocation(payload) {
        const { truckId, latitude, longitude, speed, heading, timestamp } = payload;
        
        const locationData = {
            latitude,
            longitude,
            speed,
            heading,
            timestamp: timestamp || new Date(),
            lastSeen: new Date()
        };

        // Store location data
        this.truckLocations.set(truckId, locationData);

        // Update database
        try {
            await Truck.findByIdAndUpdate(truckId, {
                'location.coordinates': [longitude, latitude],
                'location.lastUpdated': new Date(),
                'location.speed': speed,
                'location.heading': heading
            });
        } catch (error) {
            logger.error('Failed to update truck location in database:', error);
        }

        // Broadcast to subscribed clients
        this.broadcastToSubscribers('truck', truckId, {
            type: 'truck_location_update',
            data: { truckId, ...locationData }
        });

        // Check for geofence alerts
        await this.checkGeofenceAlerts(truckId, latitude, longitude);
    }

    // Update job card progress in real-time
    async updateJobCardProgress(payload) {
        const { jobCardId, status, progress, milestone, timestamp } = payload;
        
        const updateData = {
            status,
            progress,
            milestone,
            timestamp: timestamp || new Date()
        };

        // Store update data
        this.jobCardUpdates.set(jobCardId, updateData);

        // Update database
        try {
            const updateFields = {};
            if (status) updateFields.status = status;
            if (milestone) {
                updateFields.$push = { milestones: milestone };
            }

            await JobCard.findByIdAndUpdate(jobCardId, updateFields);
        } catch (error) {
            logger.error('Failed to update job card in database:', error);
        }

        // Broadcast to subscribed clients
        this.broadcastToSubscribers('jobcard', jobCardId, {
            type: 'jobcard_progress_update',
            data: { jobCardId, ...updateData }
        });
    }

    // Broadcast message to subscribers
    broadcastToSubscribers(type, id, message) {
        this.connections.forEach((ws, userId) => {
            if (ws.readyState === WebSocket.OPEN) {
                const isSubscribed = type === 'truck' 
                    ? ws.subscribedTrucks?.has(id)
                    : ws.subscribedJobCards?.has(id);
                
                if (isSubscribed) {
                    ws.send(JSON.stringify(message));
                }
            }
        });
    }

    // Check for geofence alerts (2025 AI feature)
    async checkGeofenceAlerts(truckId, latitude, longitude) {
        try {
            // Define service center geofences (example coordinates)
            const serviceCenters = [
                { name: 'Main Service Center', lat: 25.2048, lng: 55.2708, radius: 1000 }, // Dubai example
                { name: 'North Branch', lat: 25.3548, lng: 55.4105, radius: 800 }
            ];

            const truck = await Truck.findById(truckId);
            if (!truck) return;

            serviceCenters.forEach(center => {
                const distance = this.calculateDistance(latitude, longitude, center.lat, center.lng);
                
                if (distance <= center.radius) {
                    // Truck entered service center area
                    this.broadcastToSubscribers('truck', truckId, {
                        type: 'geofence_alert',
                        data: {
                            truckId,
                            message: `Truck entered ${center.name}`,
                            location: { latitude, longitude },
                            serviceCenter: center.name,
                            timestamp: new Date()
                        }
                    });
                }
            });
        } catch (error) {
            logger.error('Geofence check error:', error);
        }
    }

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    }

    // Remove WebSocket connection
    removeConnection(ws) {
        if (ws.userId) {
            this.connections.delete(ws.userId);
        }
    }

    // Get real-time analytics
    getAnalytics() {
        return {
            activeConnections: this.connections.size,
            trackedTrucks: this.truckLocations.size,
            activeJobCards: this.jobCardUpdates.size,
            uptime: process.uptime()
        };
    }

    // Send system-wide notification
    broadcastNotification(message) {
        this.connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'system_notification',
                    data: message
                }));
            }
        });
    }
}

// Export singleton instance
const realTimeTracker = new RealTimeTracker();
module.exports = realTimeTraacker;
