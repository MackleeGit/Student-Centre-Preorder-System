import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

export const useRealtimeNotifications = (userId) => {



  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    // Fetch initial notifications

    const fetchNotifications = async () => {
      if (!userId) {
        setNotifications([]);
        setLoading(false);
        return;
      }


      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient', userId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data || []);
      }
      setLoading(false);
    };

    fetchNotifications();

    // Only set up subscription if userId exists
    if (!userId) {
      return;
    }

    // Set up real-time subscription
    const subscription = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient=eq.${userId}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient=eq.${userId}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          setNotifications(prev =>
            prev.map(notif =>
              notif.notifid === payload.new.notifid ? payload.new : notif
            )
          );
        }
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('notifid', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      setNotifications(prev =>
        prev.map(notif =>
          notif.notifid === notificationId ? { ...notif, read: true } : notif
        )
      );
    }
  };

  return { notifications, loading, markAsRead };
};