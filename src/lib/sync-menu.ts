"use client"

import { collection, doc, setDoc, Firestore, serverTimestamp } from "firebase/firestore";
import { menuItems } from "./menu-data"; 

export const pushLocalMenuToFirestore = async (db: Firestore) => {
  try {
    const menuCollection = collection(db, "menu_items");
    let count = 0;

    for (const item of menuItems) {
      const docRef = doc(menuCollection, item.id.toString());
      await setDoc(docRef, {
        name: item.name,
        description: item.description,
        price: Number(item.price),
        category: item.category,
        image: item.image || "",
        available: item.available,
        lastUpdated: serverTimestamp()
      });
      count++;
    }

    return { success: true, count: count };
  } catch (error: any) {
    console.error("Firestore Sync Error:", error);
    return { success: false, error: error.message };
  }
};
