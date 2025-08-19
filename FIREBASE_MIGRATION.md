# Firebase Migration Guide

This guide will help you set up your EM Inventory System with Firebase.

## 🚀 Prerequisites

1. **Node.js** (v16 or higher)
2. **Firebase CLI** installed globally
3. **Google account** with Firebase access

## 📋 Step-by-Step Migration Process

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "em-inventory-system")
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 4: Initialize Firebase in Your Project

```bash
# Navigate to your project directory
cd eminventorysystem

# Initialize Firebase
firebase init
```

**Select the following options:**
- Firestore: Database
- Storage: File storage
- Hosting: Web app hosting
- Emulators: Local development

**Choose your project:**
- Select the project you created in Step 3

**Configure Firestore:**
- Use existing database: No
- Database rules file: firebase/firestore.rules
- Firestore indexes file: firebase/firestore.indexes.json

**Configure Storage:**
- Storage rules file: firebase/storage.rules

**Configure Hosting:**
- Public directory: dist
- Single-page app: Yes
- GitHub Actions: No

**Configure Emulators:**
- Auth: Yes
- Firestore: Yes
- Storage: Yes
- Hosting: Yes
- Emulator UI: Yes

### Step 5: Update Environment Variables

Create or update your `.env` file with Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**To get these values:**
1. Go to Firebase Console → Project Settings
2. Scroll down to "Your apps"
3. Click the web app icon (</>)
4. Copy the configuration object

### Step 6: Install Firebase Dependencies

```bash
npm install firebase
```

### Step 7: Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

### Step 8: Start Firebase Emulators (Development)

```bash
firebase emulators:start
```

This will start local development servers:
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Storage: http://localhost:9199
- Hosting: http://localhost:5000
- Emulator UI: http://localhost:4000

### Step 9: Run Data Migration

```bash
# Run the migration script
node firebase/migrate-data.js
```

### Step 10: Update Your Application Code

The following files have been created for Firebase functionality:

- `src/lib/firebase.ts` - Firebase configuration
- `src/lib/firebaseService.ts` - Database operations
- `src/lib/firebaseAuth.ts` - Authentication service

## 🔧 Configuration Files

### Firebase Configuration (`firebase.json`)
- Configures Firestore, Storage, and Hosting
- Sets up local emulators for development

### Firestore Rules (`firebase/firestore.rules`)
- Defines security rules for database access
- Implements role-based access control

### Storage Rules (`firebase/storage.rules`)
- Controls file upload permissions
- Manages user avatar and file access

### Firestore Indexes (`firebase/firestore.indexes.json`)
- Optimizes query performance
- Defines composite indexes for complex queries

## 📊 Database Collections

The following collections will be created in Firestore:

1. **users** - User profiles and authentication data
2. **profiles** - Extended user information
3. **inventory** - Inventory items and stock levels
4. **spareParts** - Spare parts management
5. **requisitions** - Item requests from users
6. **issuances** - Item distribution records
7. **returns** - Item return records
8. **gatePasses** - Gate pass management
9. **userActions** - User activity logging
10. **systemSettings** - System configuration

## 🔐 Security Features

- **Authentication**: Email/password with Firebase Auth
- **Authorization**: Role-based access control
- **Data Validation**: Firestore security rules
- **File Security**: Storage security rules
- **Audit Logging**: User action tracking

## 🚀 Deployment

### Deploy to Production

```bash
# Build your application
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy all (rules, storage, hosting)
firebase deploy
```

### Environment-Specific Deployments

```bash
# Deploy to staging
firebase use staging
firebase deploy

# Deploy to production
firebase use production
firebase deploy
```

## 🧪 Testing

### Local Testing
```bash
# Start emulators
firebase emulators:start

# Run tests
npm test
```

### Production Testing
1. Deploy to staging environment
2. Test all functionality
3. Verify security rules
4. Deploy to production

## 📝 Migration Checklist

- [ ] Firebase CLI installed and logged in
- [ ] Firebase project created
- [ ] Project initialized with `firebase init`
- [ ] Environment variables configured
- [ ] Security rules deployed
- [ ] Data migration completed
- [ ] Application code updated
- [ ] Local testing completed
- [ ] Production deployment tested

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Firebase API key and project ID
   - Check Firestore rules deployment
   - Ensure emulators are running (for local development)

2. **Permission Denied Errors**
   - Review Firestore security rules
   - Check user authentication status
   - Verify user roles and permissions

3. **Connection Issues**
   - Check internet connection
   - Verify Firebase project status
   - Review console for error messages

### Getting Help

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

## 🎯 Next Steps

After completing the migration:

1. **Monitor Performance**: Use Firebase Console to monitor usage
2. **Set Up Alerts**: Configure billing and usage alerts
3. **Backup Strategy**: Implement regular data backups
4. **Security Review**: Regular security rule audits
5. **Performance Optimization**: Monitor and optimize queries

## 📚 Additional Resources

- [Firebase Best Practices](https://firebase.google.com/docs/projects/best-practices)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-modeling)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

---

**Note**: This migration involves significant changes to your application architecture. Make sure to test thoroughly in a development environment before deploying to production.
