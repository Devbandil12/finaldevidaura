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

export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState();
  const [address, setAddress] = useState([]);
  const [orders, setOrders] = useState([]);
  const { user } = useUser();

  const getUserDetail = async () => {
    try {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      const email = user.primaryEmailAddress.emailAddress;
      const clerkId = user.id;
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

      const res = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerk_id, clerkId));
        .where(eq(usersTable.email, email));

      if (res.length > 0) {
        const dbUser = res[0];

        // ✅ Update clerk_id if it's missing
        if (!dbUser.clerk_id) {
          await db
            .update(usersTable)
            .set({ clerk_id: clerkId })
            .where(eq(usersTable.id, dbUser.id));
          dbUser.clerk_id = clerkId;
          console.log("✅ Clerk ID added to existing user");
        }

        setUserdetails(dbUser);
      } else {
        // 🆕 New user, insert into DB
        const newUser = await db
          .insert(usersTable)
          .values({
            name,
            email,
            role: "user",
            cart_length: 0,
            clerk_id: clerkId,
          })
          .returning();

        setUserdetails(newUser[0]);
        console.log("✅ New user inserted into DB");
      }
    } catch (error) {
      console.error("❌ Failed to get or create user:", error);
    }
  };

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

  useEffect(() => {
    if (user) getUserDetail();
  }, [user]);

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
