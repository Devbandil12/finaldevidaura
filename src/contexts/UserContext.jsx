import React, { createContext, useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { db } from "../../configs";
import {
  usersTable,
  addressTable,
  UserAddressTable,
  ordersTable,
  orderItemsTable,
  productsTable,
} from "../../configs/schema";
import { eq } from "drizzle-orm";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const [orders, setOrders] = useState([]);
  const { user } = useUser();

  const getUserDetail = async () => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

      if (!email) {
        console.warn("❌ Email not found from Clerk");
        return;
      }

      const res = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (res.length > 0) {
        setUserdetails(res[0]);
      } else {
        const [newUser] = await db
          .insert(usersTable)
          .values({
            name,
            email,
            role: "user",
            cartLength: 0,
          })
          .returning();
        setUserdetails(newUser);
      }
    } catch (err) {
      console.error("❌ Error in getUserDetail:", err);
    }
  };

  const getMyOrders = async () => {
    if (!userdetails?.id) return;

    try {
      const res = await db
        .select({
          orderId: ordersTable.id,
          totalAmount: ordersTable.totalAmount,
          status: ordersTable.status,
          paymentMode: ordersTable.paymentMode,
          paymentStatus: ordersTable.paymentStatus,
          createdAt: ordersTable.createdAt,
          productId: orderItemsTable.productId,
          quantity: orderItemsTable.quantity,
          price: orderItemsTable.price,
          productName: productsTable.name,
          productImage: productsTable.imageurl,
        })
        .from(ordersTable)
        .innerJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
        .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
        .where(eq(ordersTable.userId, userdetails.id))
        .orderBy(ordersTable.createdAt);

      const grouped = res.reduce((acc, item) => {
        if (!acc[item.orderId]) {
          acc[item.orderId] = {
            orderId: item.orderId,
            totalAmount: item.totalAmount,
            status: item.status,
            createdAt: item.createdAt,
            paymentStatus: item.paymentStatus,
            paymentMode: item.paymentMode,
            items: [],
          };
        }
        acc[item.orderId].items.push({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: item.price,
        });
        return acc;
      }, {});

      setOrders(Object.values(grouped));
    } catch (error) {
      console.error("❌ Failed to get orders:", error);
    }
  };

  const getUserAddress = async () => {
    try {
      const res = await db
        .select()
        .from(UserAddressTable)
        .where(eq(UserAddressTable.userId, userdetails?.id));
      setAddress(res);
    } catch (error) {
      console.error("❌ Failed to get user addresses:", error);
    }
  };

  useEffect(() => {
    if (user) getUserDetail();
  }, [user]);

  useEffect(() => {
    if (userdetails) {
      getMyOrders();
      getUserAddress();
    }
  }, [userdetails]);

  return (
    <UserContext.Provider
      value={{
        userdetails,
        setUserdetails,
        orders,
        address,
        setAddress,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
