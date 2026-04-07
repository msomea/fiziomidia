// Notification Priority Examples
// This file demonstrates how to create notifications with different priority levels

const User = require('../models/User');

// Example 1: Critical notification (Red) - Requires immediate action
const createCriticalNotification = async (userId) => {
  const user = await User.findById(userId);
  
  const criticalNotification = {
    type: 'license_rejected',
    message: 'Your license application has been rejected. Please contact support for assistance.',
    priority: 'critical', // This will override the type-based mapping
    relatedId: 'license_123',
    relatedModel: 'License',
    read: false,
    createdAt: new Date()
  };
  
  user.notifications.push(criticalNotification);
  await user.save();
};

// Example 2: Important notification (Orange) - Requires action
const createImportantNotification = async (userId) => {
  const user = await User.findById(userId);
  
  const importantNotification = {
    type: 'new_appointment',
    message: 'You have a new appointment request. Please review and accept or decline.',
    priority: 'important', // Will use this priority instead of type mapping
    relatedId: 'appointment_456',
    relatedModel: 'Appointment',
    read: false,
    createdAt: new Date()
  };
  
  user.notifications.push(importantNotification);
  await user.save();
};

// Example 3: Update notification (Blue) - Status change
const createUpdateNotification = async (userId) => {
  const user = await User.findById(userId);
  
  const updateNotification = {
    type: 'clinic_invitation',
    message: 'You have been invited to join a new clinic.',
    priority: 'update', // Will use this priority instead of type mapping
    relatedId: 'clinic_789',
    relatedModel: 'Clinic',
    read: false,
    createdAt: new Date()
  };
  
  user.notifications.push(updateNotification);
  await user.save();
};

// Example 4: Information notification (Gray) - General info
const createInformationNotification = async (userId) => {
  const user = await User.findById(userId);
  
  const infoNotification = {
    type: 'welcome_message',
    message: 'Welcome to FizioMidia! Your account has been successfully created.',
    // No priority specified - will default to 'information'
    relatedId: null,
    relatedModel: null,
    read: false,
    createdAt: new Date()
  };
  
  user.notifications.push(infoNotification);
  await user.save();
};

// Example 5: Using type-based priority (fallback to level mapping)
const createTypeBasedNotification = async (userId) => {
  const user = await User.findById(userId);
  
  // This will use the NotificationSection component's level mapping
  // 'setup_working_hours' maps to 'important' level
  const typeBasedNotification = {
    type: 'setup_working_hours',
    message: 'Please configure your working hours for better scheduling.',
    // No explicit priority - will use type-based mapping
    relatedId: 'profile_123',
    relatedModel: 'User',
    read: false,
    createdAt: new Date()
  };
  
  user.notifications.push(typeBasedNotification);
  await user.save();
};

module.exports = {
  createCriticalNotification,
  createImportantNotification,
  createUpdateNotification,
  createInformationNotification,
  createTypeBasedNotification
};
