// src/contexts/OrderContext.js

import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../../configs";
import {
  addressTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  usersTable,
} from "../../configs/schema";
import { eq, inArray } from "drizzle-orm";
import { UserContext } from "./UserContext";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const { userdetails } = useContext(UserContext);

  // Fetch orders and their items from the database
  const getorders = async () => {
    if (!userdetails) return;

    try {
      // Main order query
      const orderQuery = await db
        .select({
          phone: ordersTable.phone,
          orderId: ordersTable.id,
          userId: ordersTable.userId,
          userName: usersTable.name,
          email: usersTable.email,
          paymentMode: ordersTable.paymentMode,
          totalAmount: ordersTable.totalAmount,
          paymentStatus: ordersTable.paymentStatus,
          transactionId: ordersTable.transactionId,
          status: ordersTable.status,
          progressStep: ordersTable.progressStep,
          createdAt: ordersTable.createdAt,
          // Address fields
          street: addressTable.street,
          city: addressTable.city,
          state: addressTable.state,
          postalCode: addressTable.postalCode,
          country: addressTable.country,
          // Refund metadata
          refundId: ordersTable.refund_id,
          refundAmount: ordersTable.refund_amount,
          refundStatus: ordersTable.refund_status,
          refundSpeed: ordersTable.refund_speed,
          refundInitiatedAt: ordersTable.refund_initiated_at,
          refundCompletedAt: ordersTable.refund_completed_at,
        })
        .from(ordersTable)
        .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .leftJoin(addressTable, eq(addressTable.userId, ordersTable.userId));

      const orderIds = orderQuery.map((o) => o.orderId);
      if (orderIds.length === 0) {
        setOrders([]);
        return;
      }

      // Fetch corresponding order items
      const productQuery = await db
        .select({
          orderId: orderItemsTable.orderId,
          productId: orderItemsTable.productId,
          quantity: orderItemsTable.quantity,
          price: orderItemsTable.price,
          productName: productsTable.name,
        })
        .from(orderItemsTable)
        .innerJoin(
          productsTable,
          eq(orderItemsTable.productId, productsTable.id)
        )
        .where(inArray(orderItemsTable.orderId, orderIds));

      // Merge orders with their items
      const map = new Map();
      orderQuery.forEach((o) => {
        map.set(o.orderId, { ...o, items: [] });
      });
      productQuery.forEach((p) => {
        const entry = map.get(p.orderId);
        if (entry) entry.items.push(p);
      });

      setOrders(Array.from(map.values()));
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  // Initial load and whenever user details change
  useEffect(() => {
    getorders();
  }, [userdetails]);

  // Backup to localStorage
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  // Update an order's status (e.g. marking as cancelled)
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await db
        .update(ordersTable)
        .set({
          status: newStatus,
          progressStep: newStatus === "Order Cancelled" ? 0 : undefined,
        })
        .where(eq(ordersTable.id, orderId));
      await getorders();
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  // Update refund metadata for an order, then re-fetch
  const updateOrderRefund = async (orderId, refund) => {
    try {
      await db
        .update(ordersTable)
        .set({
          refund_id: refund.id,
          refund_amount: refund.amount,
          refund_status: refund.status,
          refund_speed: refund.speedProcessed,  // actual speed_processed
          refund_initiated_at: new Date(refund.createdAt * 1000).toISOString(),
          refund_completed_at:
            refund.status === "processed" && refund.processedAt
              ? new Date(refund.processedAt * 1000).toISOString()
              : null,
          paymentStatus:
            refund.status === "processed" ? "refunded" : undefined,
        })
        .where(eq(ordersTable.id, orderId));
      await getorders();
    } catch (err) {
      console.error("Failed to update refund info:", err);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        getorders,
        orders,
        setOrders,
        updateOrderStatus,
        updateOrderRefund,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
