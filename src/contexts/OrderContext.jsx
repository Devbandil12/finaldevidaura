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

  const getorders = async () => {
    if (!userdetails) return;

    try {
      // 1) Fetch orders with flat refund_* columns
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
        .leftJoin(addressTable, eq(addressTable.userId, ordersTable.userId));

      const orderIds = orderQuery.map((o) => o.orderId);
      if (!orderIds.length) {
        setOrders([]);
        return;
      }

      // 2) Fetch order items
      const productQuery = await db
        .select({
          orderId:    orderItemsTable.orderId,
          productId:  orderItemsTable.productId,
          quantity:   orderItemsTable.quantity,
          price:      orderItemsTable.price,
          productName: productsTable.name,
          img:         productsTable.imageurl,
          size:        productsTable.size,
        })
        .from(orderItemsTable)
        .innerJoin(
          productsTable,
          eq(orderItemsTable.productId, productsTable.id)
        )
        .where(inArray(orderItemsTable.orderId, orderIds));

      // 3) Merge + reshape into nested refund object
      const map = new Map();
      orderQuery.forEach((o) => {
        map.set(o.orderId, {
          ...o,
          
          refund:{
                id:            o.refundId,
                amount:        o.refundAmount,
                status:        o.refundStatus,
                speedProcessed:o.refundSpeed,
            created_at: o.refundInitiatedAt
              ? new Date(o.refundInitiatedAt).getTime() / 1000
              : null,
            processed_at: o.refundCompletedAt
              ? new Date(o.refundCompletedAt).getTime() / 1000
              : null,
              }, 
              items: [],
        });
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

  // Optional: persist in localStorage
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

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

  const updateOrderRefund = async (orderId, refund) => {
    try {
      await db
        .update(ordersTable)
        .set({
          refund_id:           refund.id,
          refund_amount:       refund.amount,
          refund_status:       refund.status,
          refund_speed:        refund.speedProcessed,
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
        orders,
        getorders,
        setOrders,
        updateOrderStatus,
        updateOrderRefund,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
