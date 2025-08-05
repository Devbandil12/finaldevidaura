import { useUser } from "@clerk/clerk-react";
import React, { createContext, useState, useEffect } from "react";
import { db } from "../../configs";
import {
  orderItemsTable,
  ordersTable,
  usersTable,
  productsTable,
  addressTable,
  addToCartTable,
  UserAddressTable,
} from "../../configs/schema";
import { eq } from "drizzle-orm";

// Create the context
export const UserContext = createContext();

// Provider component
export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState();
  const [address, setAddress] = useState([]);
  const [orders, setOrders] = useState([]);
  const { user } = useUser();

  // 🔄 Fetch user from DB by email
  const getUserDetail = async () => {
    try {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      const res = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, user.primaryEmailAddress.emailAddress));

      if (res.length > 0) {
        setUserdetails(res[0]);
      } else {
        // 🆕 Create user if not exists
        const newUser = {
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          email: user.primaryEmailAddress.emailAddress,
          role: "user",
          cart_length: 0,
          clerk_id: user.id,
        };

        const inserted = await db.insert(usersTable).values(newUser).returning();
        setUserdetails(inserted[0]);
      }
    } catch (error) {
      console.error("❌ Failed to get or create user:", error);
    }
  };

  // ✅ Sync Clerk ID to existing user if not set
  const syncClerkIdToUser = async () => {
    if (!user || !userdetails || userdetails.clerk_id) return;

    try {
      await db
        .update(usersTable)
        .set({ clerk_id: user.id })
        .where(eq(usersTable.id, userdetails.id));
      setUserdetails((prev) => ({ ...prev, clerk_id: user.id }));
      console.log("✅ Clerk ID synced to user");
    } catch (error) {
      console.error("❌ Failed to sync Clerk ID:", error);
    }
  };

  // 🛒 Get all orders with products
  const getMyOrders = async () => {
    try {
      if (!userdetails?.id) return;

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

      const groupedOrders = res.reduce((acc, item) => {
        const orderId = item.orderId;
        if (!acc[orderId]) {
          acc[orderId] = {
            orderId: item.orderId,
            totalAmount: item.totalAmount,
            status: item.status,
            createdAt: item.createdAt,
            paymentStatus: item.paymentStatus,
            paymentMode: item.paymentMode,
            items: [],
          };
        }
        acc[orderId].items.push({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: item.price,
        });
        return acc;
      }, {});

      setOrders(Object.values(groupedOrders));
    } catch (error) {
      console.error("❌ Failed to get orders:", error);
    }
  };

  const getAddress = async () => {
    try {
      const res = await db
        .select()
        .from(addressTable)
        .where(eq(addressTable.userId, userdetails?.id));
    } catch (error) {
      console.error("❌ Failed to get address:", error);
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
      console.error("❌ Failed to get user address:", error);
    }
  };

  // 🔁 When user loads
  useEffect(() => {
    if (user) getUserDetail();
  }, [user]);

  // 🔁 When userdetails loads
  useEffect(() => {
    if (userdetails) {
      getMyOrders();
      getAddress();
      getUserAddress();
      syncClerkIdToUser();
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
