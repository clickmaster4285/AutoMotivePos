# AutoMotivee - Automotive Workshop & POS System

## Overview
AutoMotivee is a full-stack automotive workshop management system with integrated Point of Sale (POS). Built with **React/TypeScript (frontend)** and **Node.js/Express/MongoDB (backend)**.

## 🚀 Key Features

### Core Modules
| Module | Description |
|--------|-------------|
| **Dashboard** | Overview analytics (sales, jobs, inventory) |
| **POS** | Point of Sale with cart, payments, receipts |
| **Inventory** | Products, stock management, centralized products |
| **Job Cards** | Workshop jobs (services + parts), status tracking |
| **Transactions** | Transaction history, reprint receipts |
| **Customers** | Customer database with credit tracking |
| **Suppliers** | Vendor management |
| **Branches** | Multi-branch support (admin only) |
| **Warehouses** | Inventory locations |
| **HR** | Employee management, shifts, payroll |
| **Reports** | Sales/inventory reports |
| **Audit Log** | Activity tracking |
| **Settings** | Company profile (logo, tax, currency), notifications |

### Backend Features
- **MongoDB** schemas for all entities
- **JWT auth** + role-based permissions
- **Multer file uploads** (logos, images)
- **Audit logging** on key actions
- **Multi-tenancy** (branches)

### Frontend Features
- **TanStack Query** for data fetching/caching
- **TailwindCSS + shadcn/ui** design system
- **React Router** SPA navigation
- **Global app state** (AppStateProvider)
- **Responsive sidebar** navigation
- **Print receipts** (iframe)

## 📁 Project Structure

```
autoMotivee/
├── backend/
│   ├── controllers/     # API logic
│   ├── models/         # MongoDB schemas
│   ├── routes/         # Express routes
│   ├── middlewares/    # Auth, upload, permissions
│   ├── uploads/        # Static files
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/        # API hooks & types
│   │   ├── components/ # UI components (POS, Settings, etc)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # Route views
│   │   ├── providers/  # AppStateProvider
│   │   └── lib/        # Utils, permissions, query client
│   └── vite.config.ts
└── README.md
```

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Backend** | Node.js, Express, MongoDB, Mongoose, Multer, bcrypt, JWT |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| **State** | TanStack Query (RQ), Zustand-like AppStateProvider |
| **Auth** | JWT + Permission middleware |
| **DB** | MongoDB (schemas: User, Transaction, Product, etc) |

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm start  # or node server.js (port 6001)
```

### Frontend
```bash
cd frontend
bun install
bun dev     # or npm run dev (port 5173)
```

### Features Ready
✅ **POS** - Complete checkout + receipts  
✅ **Inventory** - Stock management  
✅ **Job Cards** - Workshop jobs  
✅ **Transactions** - History + reprint  
✅ **Multi-branch** - Admin support  
✅ **Company Settings** - Logo, tax, currency  
✅ **Receipts** - Custom cashier names  
✅ **Sidebar** - Dynamic logo/company name  

## 📱 API Endpoints (Key)
```
POST /api/auth/login
GET  /api/settings
PUT  /api/settings (logo upload)
POST /api/transactions
GET  /api/transactions
```

## 🔐 Permissions
RBAC system with permission IDs like:
- `pos.transaction.read`
- `inventory.product.read`
- `settings.store.update`

## 📄 Receipt Generation
- Thermal printer optimized (72mm)
- Dynamic cashier name (current user)
- Company settings integration
- Void handling

**Workshop + POS = Complete automotive business solution!** 🚗🔧
