import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Initializing Firebase project...');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.error('❌ Firebase CLI is not installed. Please install it first:');
  console.error('npm install -g firebase-tools');
  console.error('Then run: firebase login');
  process.exit(1);
}

// Check if user is logged in
try {
  execSync('firebase projects:list', { stdio: 'ignore' });
  console.log('✅ Firebase user is logged in');
} catch (error) {
  console.error('❌ Please login to Firebase first:');
  console.error('firebase login');
  process.exit(1);
}

// Initialize Firebase project
try {
  console.log('📁 Initializing Firebase project...');
  execSync('firebase init', { stdio: 'inherit' });
  console.log('✅ Firebase project initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase project:', error.message);
  process.exit(1);
}

console.log('\n🎉 Firebase project setup complete!');
console.log('\nNext steps:');
console.log('1. Update your environment variables with Firebase config');
console.log('2. Deploy your security rules: firebase deploy --only firestore:rules');
console.log('3. Deploy your storage rules: firebase deploy --only storage');
console.log('4. Start the emulators: firebase emulators:start');
