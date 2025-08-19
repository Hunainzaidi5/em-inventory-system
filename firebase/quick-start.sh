#!/bin/bash

echo "🚀 EM Inventory System - Firebase Migration Quick Start"
echo "======================================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Please install it first: npm install -g firebase-tools"
    echo "Then run: firebase login"
    exit 1
fi

echo "✅ Firebase CLI is installed"

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Please login to Firebase first:"
    echo "firebase login"
    exit 1
fi

echo "✅ Firebase user is logged in"
echo ""

# Initialize Firebase project
echo "📁 Initializing Firebase project..."
firebase init

echo ""
echo "🎉 Firebase project setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your environment variables with Firebase config"
echo "2. Deploy your security rules: npm run firebase:deploy:rules"
echo "3. Start the emulators: npm run firebase:emulators"
echo "4. Run data migration: npm run firebase:migrate"
echo ""
echo "For detailed instructions, see FIREBASE_MIGRATION.md"
