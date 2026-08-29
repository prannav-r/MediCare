# MediCare

**[🚀 View Live Demo on Vercel](https://medi-care-one-orcin.vercel.app/)**

MediCare is a modern, responsive web application designed to help users seamlessly manage their medical prescriptions, track daily medication schedules, and automatically manage medicine inventory. 

## Features

### 🔐 Secure Authentication
- Full user registration and login flows.
- Secure, token-based sessions managed by Supabase Auth.
- Strict Row Level Security (RLS) ensuring your medical data is completely private.

### 📝 Prescription Management
- **Create & Edit**: Easily create, view, edit, and delete active prescriptions.
- **Medicine Details**: Add specific medicines to prescriptions with start and end dates.
- **Flexible Dosing**: Full support for fractional/floating-point doses (e.g., `0.5` tablets, `1.5` tablets).
- **Fixed Scheduling**: Easily assign medicines to Morning (07:00), Afternoon (12:00), and Evening (19:00) routines.

### 📊 Intelligent Dashboard
- **Live Summary**: Quick overview of active prescriptions and active medicines.
- **Smart Low Stock Alerts**: Real-time banners showing exactly which medicines are running low, how many you have, and how many more you need to complete your active prescriptions.
- **Today's Schedule**: A beautifully formatted table showing exactly what you need to take today. It features a live visual tick mark (✅) that dynamically updates to show if a medication has been taken based on the current time of day.

### 📅 Interactive Calendar
- A full-page monthly calendar tracking your medication schedule.
- Visual dots indicate morning, afternoon, and evening requirements for each day.
- **Daily Snapshot**: Click on any date to open an interactive dialog showing the exact medications scheduled for that specific day, complete with status indicators.

### 📦 Automated Inventory Management
- **Zero-Friction Sync**: Inventory is managed entirely autonomously in the cloud.
- **Backend Cron Job**: Powered by a secure PostgreSQL `pg_cron` job running natively in Supabase.
- **Nightly Decrements**: At 10 PM UTC every day, the backend intelligently calculates theoretical doses taken based on your active prescriptions and fractional quantities, and safely decrements your physical stock.

### 💊 Medicine Catalog
- A pre-populated, searchable database of common medicines.
- Instantly search and add standard medicines while building your prescriptions without manually typing out drug details every time.

## Tech Stack
**Frontend:**
- **Core**: React 19, TypeScript, Vite 8
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI)
- **State & Data**: React Query (TanStack Query v5)
- **Forms**: React Hook Form, Zod

**Backend (Backend-as-a-Service):**
- **Core**: Supabase
- **Database**: PostgreSQL
- **Automation**: `pg_cron` extension for background jobs

## Local Development

### Prerequisites
- Node.js (v18+)
- npm
- A Supabase Project

### Environment Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env.local` file in the root directory and add your Supabase keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Database Setup
To configure the Supabase backend:
1. Open your Supabase Dashboard.
2. Navigate to the SQL Editor.
3. Copy the contents of `supabase/schema.sql` from this repository.
4. Run the script to generate all tables, RLS policies, and the nightly cron job.

### Running the App
Start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.
