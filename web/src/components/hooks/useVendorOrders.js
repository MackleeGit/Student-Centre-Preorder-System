import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient.js";

export const useVendorOrders = (vendorId) => {
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [initalOrderLoading, setInitialOrderLoading] = useState(true);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);


  const fetchOrders = async () => {
    if (!vendorId) return;
    setInitialOrderLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("vendorid", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      setInitialOrderLoading(false);
      return;
    }

    const incoming = data.filter(order => order.order_status === "pending");
    const approved = data.filter(order =>
      ["processing", "ready"].includes(order.order_status)
    );

    setIncomingOrders(incoming);
    setApprovedOrders(approved);
    setInitialOrderLoading(false);
  };


  const refetchOrders = async () => {
    if (!vendorId) return;
    setIsRefreshingOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("vendorid", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return;
      setIsRefreshingOrders(false);
    }

    const incoming = data.filter(order => order.order_status === "pending");
    const approved = data.filter(order =>
      ["processing", "ready"].includes(order.order_status)
    );

    setIncomingOrders(incoming);
    setApprovedOrders(approved);
    setIsRefreshingOrders(false);
  };



  useEffect(() => {
    fetchOrders();
  }, [vendorId]);

  return {
    incomingOrders,
    approvedOrders,
    setIncomingOrders,
    setApprovedOrders,
    initalOrderLoading,
    isRefreshingOrders,
    fetchOrders,
    refetchOrders
  };
};
