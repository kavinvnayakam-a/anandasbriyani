const admin = require('firebase-admin');

// We don't pass any arguments to initializeApp()
// It will automatically look for your Firebase CLI credentials
admin.initializeApp({
  projectId: "warning:
Key creation is not allowed on this service account. Please check if service account key creation is restricted by organization policies.warning:
Key creation is not allowed on this service account. Please check if service account key creation is restricted by organization policies." // Find this in your firebase.json or Firebase console
});

const db = admin.firestore();

// Paste your menu data here
const menuData = [
  { name: "Classic Croissant", price: 120, category: "Pastries", available: true },
  // ... rest of your data
];

async function upload() {
  console.log("Checking credentials and starting upload...");
  const colRef = db.collection('menu_items');
  
  for (const item of menuData) {
    try {
      await colRef.add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Success: ${item.name}`);
    } catch (error) {
      console.error(`❌ Failed: ${item.name}`, error);
    }
  }
  console.log("Done!");
}

upload();