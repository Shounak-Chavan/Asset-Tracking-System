# Frontend App

React + TypeScript + Vite frontend for the Asset Tracking System.

## Requirements

- Node.js 20 or newer
- npm
- Backend API running on `http://localhost:8000`

## Setup

```bash
cd frontend-app
npm install
cp .env.example .env.local
```

Update `frontend-app/.env.local` if your backend URL is different:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run on all network interfaces:

```bash
npm run dev -- --host 0.0.0.0
```

## Scripts

```bash
npm run dev      # Start Vite development server
npm run build    # Type-check and build production assets
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Important Routes

- `/` - Home
- `/assets` - Catalog
- `/bookings` - User bookings
- `/terms` - Terms & Conditions / Rental Policy
- `/admin` - Admin dashboard
- `/dry-cleaning/login` - Dry-cleaning staff login
- `/dry-cleaning/portal` - Dry-cleaning staff portal

## Styling

The frontend uses the Riwaayat dark/gold design system defined in `src/index.css` with shared layout and UI components under `src/components/`.
