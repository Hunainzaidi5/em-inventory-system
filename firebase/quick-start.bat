@echo off
echo 🚀 EM Inventory System - Firebase Migration Quick Start
echo ======================================================
echo.

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI is not installed.
    echo Please install it first: npm install -g firebase-tools
    echo Then run: firebase login
    pause
    exit /b 1
)

echo ✅ Firebase CLI is installed

REM Check if user is logged in
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Please login to Firebase first:
    echo firebase login
    pause
    exit /b 1
)

echo ✅ Firebase user is logged in
echo.

REM Initialize Firebase project
echo 📁 Initializing Firebase project...
firebase init

echo.
echo 🎉 Firebase project setup complete!
echo.
echo Next steps:
echo 1. Update your environment variables with Firebase config
echo 2. Deploy your security rules: npm run firebase:deploy:rules
echo 3. Start the emulators: npm run firebase:emulators
echo 4. Run data migration: npm run firebase:migrate
echo.
echo For detailed instructions, see FIREBASE_MIGRATION.md
pause
