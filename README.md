# EM Stock Hub - Inventory Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployed with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FHunainzaidi5%2Fem-inventory-system)

A modern inventory management system built with React, TypeScript, and Tailwind CSS. Streamline your inventory tracking, manage stock levels, and generate insightful reports all in one place.

🔗 **Live Demo**: [https://em-inventory-system.vercel.app/](https://em-inventory-system.vercel.app/)

## 🚀 Features

- 🔐 **Authentication**
  - User registration and login (powered by Firebase)
  - Protected routes
  - Role-based access control (coming soon)

- 📦 **Inventory Management**
  - Track products and stock levels
  - Manage categories and suppliers
  - Low stock alerts and notifications
  - Barcode/QR code support

- 📊 **Reporting**
  - Sales and inventory reports
  - Export to Excel/PDF
  - Dashboard with key metrics

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Query, Context API
- **Form Handling**: React Hook Form, Zod
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Hunainzaidi5/em-inventory-system.git
   cd em-inventory-system
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add your Firebase environment variables:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
   ```

   **To get these values:**
   1. Go to Firebase Console → Project Settings
   2. Scroll down to "Your apps"
   3. Click the web app icon (</>)
   4. Copy the configuration object

4. Start the development server:
   ```