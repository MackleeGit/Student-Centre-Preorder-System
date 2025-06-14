import { supabase } from './supabaseClient.js';

// Subscription Manager
export class SubscriptionManager {
  constructor() {
    this.subscriptions = new Map();
  }

  addSubscription(key, subscription) {
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key).unsubscribe();
    }
    this.subscriptions.set(key, subscription);
    return subscription;
  }

  removeSubscription(key) {
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key).unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  cleanup() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions.clear();
  }
}

// Utility for subscribing and logging status
function subscribeWithStatusLogging(channelName, channel) {
  return channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`✅ Subscribed to ${channelName}`);
    } else {
      console.warn(`⚠️ Subscription issue on ${channelName}:`, status);
    }
  });
}

// Notifications
export const createNotificationsSubscription = (userId, onInsert, onUpdate) => {
  if (!userId) return null;

  const channelName = `notifications-${userId}`;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient=eq.${userId}`
    }, onInsert)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: `recipient=eq.${userId}`
    }, onUpdate);

  return subscribeWithStatusLogging(channelName, channel);
};

// Incoming Orders (Vendor)
export const createIncomingOrdersSubscription = (vendorId, onInsert, onUpdate) => {
  if (!vendorId) return null;

  const channelName = `incoming-orders-${vendorId}`;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
      filter: `vendorid=eq.${vendorId}`
    }, onInsert)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `vendorid=eq.${vendorId}`
    }, onUpdate);

  return subscribeWithStatusLogging(channelName, channel);
};

// Approved Orders (Vendor)
export const createApprovedOrdersSubscription = (vendorId, onUpdate) => {
  if (!vendorId) return null;

  const channelName = `approved-orders-${vendorId}`;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `vendorid=eq.${vendorId}`
    }, onUpdate);

  return subscribeWithStatusLogging(channelName, channel);
};

// User Orders (Student)
export const createUserOrdersSubscription = (userId, onInsert, onUpdate) => {
  if (!userId) return null;

  const channelName = `user-orders-${userId}`;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
      filter: `student_number=eq.${userId}`
    }, onInsert)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `student_number=eq.${userId}`
    }, onUpdate);

  return subscribeWithStatusLogging(channelName, channel);
};

// Menu Items (Vendor)
export const createMenuSubscription = (vendorId, onInsert, onUpdate, onDelete) => {
  if (!vendorId) return null;

  const channelName = `menu-${vendorId}`;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'menu_items',
      filter: `vendorid=eq.${vendorId}`
    }, onInsert)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'menu_items',
      filter: `vendorid=eq.${vendorId}`
    }, onUpdate)
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'menu_items',
      filter: `vendorid=eq.${vendorId}`
    }, onDelete);

  return subscribeWithStatusLogging(channelName, channel);
};

// Vendor Status (Admin)
export const createVendorStatusSubscription = (onUpdate) => {
  const channelName = 'vendor-order_status';
  const channel = supabase.channel(channelName)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'vendors'
    }, onUpdate);

  return subscribeWithStatusLogging(channelName, channel);
};
