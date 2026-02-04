import * as admin from 'firebase-admin';
import { menuData } from './src/lib/menu-data'; // Ensure this path is correct based on where you uploaded

// No keys or Project IDs needed inside Cloud Shell! 
// It automatically detects your active project.
admin.initializeApp();

const db = admin.firestore();

async function upload() {
  console.log("🚀 Boutique Sync: Moving menu to Firestore...");
  const colRef = db.collection('menu_items');
  
  for (const item of menuData) {
    try {
      await colRef.add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Success: ${item.name}`);
    } catch (error) {
      console.error(`❌ Error on ${item.name}:`, error);
    }
  }
  console.log("\n✨ Done! Your menu is now live in the cloud.");
}

upload();