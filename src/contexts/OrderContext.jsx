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

  // Fetch orders + their items from the DB
  const getorders = async () => {
    if (!userdetails) return;
    try {
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
          date: ordersTable.createdAt, // alias for consistency with front‑end
          // address fields
          street: addressTable.street,
          city: addressTable.city,
          state: addressTable.state,
          postalCode: addressTable.postalCode,
          country: addressTable.country,
          refundId: ordersTable.refund_id,
          refundAmount: ordersTable.refund_amount,
          refundStatus: ordersTable.refund_status,
          refundSpeed: ordersTable.refund_speed,
          refundInitiatedAt: ordersTable.refund_initiated_at,
          refundCompletedAt: ordersTable.refund_completed_at,

        })
        .from(ordersTable)
        .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .leftJoin(
          addressTable,
          eq(addressTable.userId, ordersTable.userId)
        );

      const orderIds = orderQuery.map((o) => o.orderId);
      if (orderIds.length === 0) {
        setOrders([]);
        return;
      }

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

      // Merge orders + products
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

  useEffect(() => {
    getorders();
  }, [userdetails]);

  // Persist in localStorage as backup
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  /**
   * Permanently update an order's status in the DB, then re-fetch.
   */
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

  return (
    <OrderContext.Provider
      value={{ getorders, orders, setOrders, updateOrderStatus }}
    >
      {children}
    </OrderContext.Provider>
  );
};
