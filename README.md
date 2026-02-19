# AquaWatch Dashboard

A modern water meter management dashboard built with React, TypeScript, and Vite. Provides real-time visibility into water consumption, meter health, zone/building drill-downs, interactive map overlays, report generation, and user management — all powered by mock data for prototype and demonstration purposes.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Credentials](#demo-credentials)
- [Roles & Permissions](#roles--permissions)
- [Mock Data](#mock-data)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)

---

## Features

| Phase | Feature |
|-------|---------|
| 1 | Authentication — login, password reset, region selection |
| 2 | Main Dashboard — KPI cards, consumption trends, zone comparison, hot/cold breakdown |
| 3 | Sub Dashboards — Zone → Building → Meter drill-down |
| 4 | Map View — Leaflet satellite map with zone boundaries, building pins, meter pins, alert heatmap |
| 5 | Reports — On-demand report generation (CSV, XLSX, JSON, PDF print), job queue, scheduled reports |
| 6 | User Management — User list, add/edit users, activate/deactivate, role and region access control |

---

## Tech Stack

| Category | Library / Tool |
|----------|---------------|
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Maps | Leaflet + react-leaflet (ESRI World Imagery satellite tiles) |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge, date-fns |

---

## Project Structure

```
src/
├── components/
│   ├── charts/          # Recharts wrappers (consumption trend, zone comparison, etc.)
│   ├── common/          # Shared UI primitives (PlaceholderCard, etc.)
│   ├── layout/          # AppShell, Navbar, Sidebar, Breadcrumb, RequireAuth
│   ├── map/             # FullMapView, MiniMap, BuildingPopup, MeterPopup
│   ├── reports/         # ReportTypeCard, ReportConfigPanel, ReportJobQueue, ScheduledReportList
│   ├── tables/          # Reusable data tables
│   └── ui/              # Low-level components (toast, etc.)
├── context/
│   ├── AuthContext.tsx            # Login, logout, session persistence
│   ├── RegionContext.tsx          # Active region selection
│   └── UserManagementContext.tsx  # In-memory user store (seeded from mock)
├── hooks/
│   └── useMockData.ts   # Generic async mock-data loader with simulated latency
├── lib/
│   ├── constants.ts     # Colour tokens, role labels, mock credentials
│   ├── report-generator.ts  # CSV / JSON / XLSX / PDF report builder
│   └── utils.ts         # cn() and other helpers
├── mock/                # Static JSON files (users, zones, buildings, meters, events, etc.)
├── pages/
│   ├── LoginPage.tsx
│   ├── PasswordResetPage.tsx
│   ├── RegionSelectPage.tsx
│   ├── MainDashboardPage.tsx
│   ├── ZoneDashboardPage.tsx
│   ├── BuildingDashboardPage.tsx
│   ├── MeterDetailPage.tsx
│   ├── MapViewPage.tsx
│   ├── ReportsPage.tsx
│   └── users/
│       ├── UserListPage.tsx
│       ├── AddUserPage.tsx
│       └── EditUserPage.tsx
└── types/
    └── index.ts         # All shared TypeScript interfaces and types
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9+ (or **yarn** / **pnpm**)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd water_meter_dashboard

# 2. Install dependencies
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173** by default.

### Build for Production

```bash
npm run build
```

Output is written to `dist/`. Preview the production build locally:

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `sadmin@system.com` | `Admin1234@` |
| Admin | `admin@system.com` | `Admin1234@` |

> All credentials are defined in `src/lib/constants.ts` → `MOCK_CREDENTIALS`.

---

## Roles & Permissions

| Role | Label | Access |
|------|-------|--------|
| `SUPER_ADMIN` | Super Admin | Full access to everything, including all user management |
| `ADMIN` | Admin | Same as Super Admin except cannot assign/manage Super Admin accounts |
| `REGIONAL_ADMIN` | Regional Admin | Access to assigned regions; cannot manage users |
| `REGIONAL_USER` | Regional User | Read-only access to assigned regions |
| `ZONE_ADMIN` | Zone Admin | Access to assigned zones within a region |
| `ZONE_USER` | Zone User | Read-only access to assigned zones |

---

## Mock Data

All data is sourced from static JSON files in `src/mock/`. No backend or database is required.

| File | Contents |
|------|----------|
| `users.json` | 8 seed users across all roles |
| `regions.json` | 2 regions (North Campus, Industrial Block) |
| `zones.json` | 4 zones across both regions |
| `buildings.json` | 12 buildings with Pokhara, Nepal coordinates |
| `meters.json` | Water meters with HOT / COLD / MIXED types |
| `meter-events.json` | Tamper, leakage, battery, and other events |
| `map-geodata.json` | GeoJSON zone polygon boundaries |
| `kpi-summary.json` | KPI snapshot data for the main dashboard |
| `consumption-trend.json` | Time-series consumption data |
| `zone-comparison.json` | Per-zone hot/cold volumes |
| `hot-cold-breakdown.json` | Aggregate hot vs cold breakdown |
| `hourly-profile.json` | Hourly consumption profile |
| `report-jobs.json` | Seed report job queue entries |
| `scheduled-reports.json` | Seed scheduled report configurations |

User management changes (add, edit, activate/deactivate) are persisted to **`sessionStorage`** for the duration of the browser session. Refreshing the page resets to the seed data.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Environment Variables

This project currently uses no environment variables — all configuration is in `src/lib/constants.ts` and the mock JSON files. When connecting to a real backend, create a `.env.local` file at the project root:

```env
VITE_API_BASE_URL=https://your-api.example.com
VITE_MAP_TILE_URL=https://server.arcgisonline.com/...
```

> `.env*.local` files are excluded from version control via `.gitignore`.
