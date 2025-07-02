// hooks/useStudentOrders.js
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient.js";

export const useStudentOrders = (studentNumber) => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [initialOrderLoading, setInitialOrderLoading] = useState(true);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [availableVendors, setAvailableVendors] = useState([]);

  const fetchOrders = async () => {
    if (!studentNumber) return;
    setInitialOrderLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("orderid, vendorid, order_status, created_at, time_accepted")
      .eq("student_number", studentNumber)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching student orders:", error);
      setInitialOrderLoading(false);
      return;
    }

    const active = data.filter(order =>
      ["pending", "processing", "ready"].includes(order.order_status)
    );
    const recent = data
      .filter(order => order.order_status === "collected")
      .slice(0, 5); // limit to 5 most recent

    setActiveOrders(active);
    setRecentOrders(recent);
    setInitialOrderLoading(false);
  };

  const fetchAvailableVendors = async () => {
    const { data, error } = await supabase
      .from("vendors")
      .select("vendorid, name, image_url, availability")
      .eq("approval_status", "approved")
      .eq("availability", "open");

    if (error) {
      console.error("❌ Error fetching available vendors:", error);
      return;
    }

    setAvailableVendors(data);
  };


  const refetchAvailableVendors = async () => {
    setIsRefreshingOrders(true);
    await fetchAvailableVendors();
    setIsRefreshingOrders(false);
  };



  const refetchOrders = async () => {
    if (!studentNumber) return;
    setIsRefreshingOrders(true);

    const { data, error } = await supabase
      .from("orders")
      .select("orderid, vendorid, order_status, created_at, time_accepted")
      .eq("student_number", studentNumber)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error refetching student orders:", error);
      setIsRefreshingOrders(false);
      return;
    }

    const active = data.filter(order =>
      ["pending", "processing", "ready"].includes(order.order_status)
    );
    const recent = data
      .filter(order => order.order_status === "collected")
      .slice(0, 5);

    setActiveOrders(active);
    setRecentOrders(recent);
    setIsRefreshingOrders(false);
  };


  //Initial data fetch
  useEffect(() => {
    fetchOrders();
    fetchAvailableVendors();
  }, [studentNumber]);

  return {
    activeOrders,
    availableVendors,
    recentOrders,
    initialOrderLoading,
    isRefreshingOrders,
    fetchOrders,
    refetchOrders,
    setActiveOrders,
    setRecentOrders,
    fetchAvailableVendors,
    refetchAvailableVendors
  };
};
