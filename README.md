# EM Stock Hub - Inventory Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployed with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FHunainzaidi5%2Fem-inventory-system)

A modern inventory management system built with React, TypeScript, and Tailwind CSS. Streamline your inventory tracking, manage stock levels, and generate insightful reports all in one place.

🔗 **Live Demo**: [https://em-inventory-system.vercel.app/](https://em-inventory-system.vercel.app/)

## 🚀 Features

- 🔐 **Authentication**
  - User registration and login (powered by Supabase)
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

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   VITE_SUPABASE_URL=https://tunnqdtqrypmunxajomv.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_BGz4lCiyn3x9XW96Ux_ctQ_i-7dQsxm
   ```

4. Start the development server:
   ```