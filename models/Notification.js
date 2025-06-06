const mongoose = require('mongoose');
const NotificationSchema = require('../schemas/Notification');

const Notification = mongoose.model('Notification', NotificationSchema);

// Marks a notification as read
Notification.markAsRead = async (notificationId) => {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error('Notification not found');
    
    notification.status = 'read';
    await notification.save();
    return notification;
};

// Creates a new notification for a user
Notification.createNotification = async (userId, message) => {
    const newNotification = new Notification({
        userId,
        message,
    });
    await newNotification.save();
    return newNotification;
};

module.exports = Notification;
