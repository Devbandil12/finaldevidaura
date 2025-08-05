// src/contexts/UserContext.jsx
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

// Create context
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState(null);
  const [address, setAddress] = useState([]);
  const [orders, setOrders] = useState([]);
  const { user } = useUser();

  // ✅ Get or create user
  const getUserDetail = async () => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      const clerkId = user?.id;
      const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

      if (!email || !clerkId) {
        console.warn("❌ Missing email or clerkId", { email, clerkId });
        return;
      }

      // 🔍 Try fetching user by clerkId
      let res = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId));

      // 🔁 Fallback to email if not found
      if (res.length === 0) {
        res = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email));
      }

      if (res.length > 0) {
        const dbUser = res[0];

        // ✏️ Update missing clerkId if needed
        if (!dbUser.clerkId) {
          const [updatedUser] = await db
            .update(usersTable)
            .set({ clerkId })
            .where(eq(usersTable.id, dbUser.id))
            .returning();
          setUserdetails(updatedUser);
          return;
        }

        // ✅ Set userdetails
        setUserdetails(dbUser);
      } else {
        // ➕ Insert new user
        const [newUser] = await db
          .insert(usersTable)
          .values({
            name,
            email,
            role: "user", // Default role
            cartLength: 0,
            clerkId,
          })
          .returning();
        setUserdetails(newUser);
      }
    } catch (err) {
      console.error("❌ Error in getUserDetail:", err);
    }
  };

  // 📦 Get user orders
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

  // 🏠 Get legacy address
  const getAddress = async () => {
    try {
      const res = await db
        .select()
        .from(addressTable)
        .where(eq(addressTable.userId, userdetails?.id));
      console.log("🏠 Address (legacy):", res);
    } catch (error) {
      console.error("❌ Failed to get legacy address:", error);
    }
  };

  // 🏠 Get user address
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

  // 🔁 On Clerk user load
  useEffect(() => {
    if (user) getUserDetail();
  }, [user]);

  // 🔁 On user details loaded
  useEffect(() => {
    if (userdetails) {
      getMyOrders();
      getAddress();
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
