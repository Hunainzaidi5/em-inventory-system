import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration - update with your actual config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data migration functions
async function migrateUsers() {
  try {
    console.log('🔄 Migrating users...');
    
    // This would read from your existing data or create sample data
    // For now, we'll create a sample admin user
    const adminUser = {
      uid: 'admin-user-id',
      email: 'admin@example.com',
      displayName: 'System Administrator',
      role: 'admin',
      createdAt: new Date(),
      lastLogin: new Date()
    };

    // Add the user to Firestore
    const userRef = doc(db, 'users', adminUser.uid);
    await setDoc(userRef, adminUser, { merge: true });
    
    console.log('✅ Successfully migrated admin user:', adminUser.email);
    return adminUser;
  } catch (error) {
    console.error('❌ Error migrating users:', error);
    throw error;
  }
  
  try {
    await setDoc(doc(db, 'users', adminUser.uid), adminUser);
    console.log('✅ Admin user created');
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  }
}

async function migrateInventory() {
  console.log('🔄 Migrating inventory...');
  
  // Sample inventory data
  const sampleInventory = [
    {
      name: 'Sample Item 1',
      category: 'General',
      quantity: 100,
      unit: 'pcs',
      location: 'Warehouse A',
      minQuantity: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Sample Item 2',
      category: 'Tools',
      quantity: 50,
      unit: 'pcs',
      location: 'Warehouse B',
      minQuantity: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  try {
    for (const item of sampleInventory) {
      await addDoc(collection(db, 'inventory'), item);
    }
    console.log('✅ Sample inventory created');
  } catch (error) {
    console.error('❌ Failed to create inventory:', error);
  }
}

async function migrateSpareParts() {
  console.log('🔄 Migrating spare parts...');
  
  // Sample spare parts data
  const sampleSpareParts = [
    {
      name: 'Motor Bearing',
      category: 'Mechanical',
      partNumber: 'MB001',
      quantity: 25,
      unit: 'pcs',
      location: 'Spare Parts Room',
      minQuantity: 5,
      supplier: 'ABC Suppliers',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  try {
    for (const part of sampleSpareParts) {
      await addDoc(collection(db, 'spareParts'), part);
    }
    console.log('✅ Sample spare parts created');
  } catch (error) {
    console.error('❌ Failed to create spare parts:', error);
  }
}

async function migrateSystemSettings() {
  console.log('🔄 Migrating system settings...');
  
  const systemSettings = {
    companyName: 'EM Inventory System',
    systemVersion: '1.0.0',
    maintenanceMode: false,
    allowUserRegistration: true,
    requireEmailVerification: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    await setDoc(doc(db, 'systemSettings', 'main'), systemSettings);
    console.log('✅ System settings created');
  } catch (error) {
    console.error('❌ Failed to create system settings:', error);
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Firebase data migration...');
  
  try {
    await migrateUsers();
    await migrateInventory();
    await migrateSpareParts();
    await migrateSystemSettings();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify the migrated data in Firebase Console');
    console.log('2. Update your application to use Firebase');
    console.log('3. Test the application with the new database');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration().catch(console.error);
}

export { runMigration };
