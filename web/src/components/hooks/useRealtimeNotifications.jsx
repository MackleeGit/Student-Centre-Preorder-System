import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient.js";

export const useRealtimeNotifications = (uid) => {
  const [notifications, setNotifications] = useState([]);
  const [initialNotificationLoading, setInitialNotificationLoading] = useState(true);
  const [isRefreshingNotifications, setIsRefreshingNotifications] = useState(false);


  const fetchNotifications = async () => {
    if (!uid) return;

    setInitialNotificationLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient", uid)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      setInitialNotificationLoading(false);

      return;
    }

    setNotifications(data);
    setInitialNotificationLoading(false);

  };


  const refetchNotifications = async () => {
    if (!uid) return;
    setIsRefreshingNotifications(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient", uid)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);

      return;
    }


    setNotifications(data);
    setIsRefreshingNotifications(false);
  };

  useEffect(() => {
    if (!uid) return;


    // Initial fetch
    fetchNotifications();
  }, []);




  const markAsRead = async (notifId) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("notifid", notifId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.notifid === notifId ? { ...n, read: true } : n)
      );
    } else {
      console.error("Failed to mark as read:", error);
    }
  };

  const formatNotificationTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchNotifications();
  }, [uid]);

  return {
    notifications,
    initialNotificationLoading,
    isRefreshingNotifications,
    markAsRead,
    formatNotificationTime,
    refetchNotifications,
    fetchNotifications,
  };
};
