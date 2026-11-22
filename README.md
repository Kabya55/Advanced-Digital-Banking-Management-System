# 🏦 Apex Bank - Advanced Digital Banking Management System

A production-grade, secure, and feature-rich Digital Banking Management System built with **Next.js (App Router)**, **TypeScript**, **Redux Toolkit**, **RTK Query**, **Node.js/Express**, and **MongoDB**. The platform simulates a real-world core banking environment with atomic fund transfers, role-based workflows, comprehensive financial analytics, and loan life-cycle governance.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [User Roles & Permissions](#-user-roles--permissions)
- [Key Features](#-key-features)
- [Redux Toolkit & RTK Query Architecture](#-redux-toolkit--rtk-query-architecture)
- [Financial Business Logic & Security](#-financial-business-logic--security)
- [Database Schema Design](#-database-schema-design)
- [Demo Credentials](#-demo-credentials)
- [Environment Variables](#-environment-variables)
- [Local Setup & Installation](#-local-setup--installation)
- [Deployment Guide](#-deployment-guide)

---

## 🏛 Architecture Overview

The system is decoupled into two dedicated applications:

```
Advanced Digital Banking Management System/
├── backend/                       # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/                # Database connection & Atlas DNS resolver
│   │   ├── controllers/           # Auth, Accounts, Transactions, Loans, Analytics
│   │   ├── middleware/            # JWT authentication & Role-Based Access Control
│   │   ├── models/                # User, BankAccount, Transaction, Loan, Request
│   │   ├── routes/                # REST API Endpoints
│   │   ├── scripts/               # Database Seeding Script
│   │   └── server.ts              # Express Server Entry Point
│   ├── .env                       # Backend Environment Variables
│   └── package.json
│
├── frontend/                      # Next.js 15 (App Router) + TypeScript Frontend
│   ├── src/
│   │   ├── app/                   # App Router pages (Customer, Staff, Admin portals)
│   │   ├── components/            # Reusable UI cards, tables, modals, charts
│   │   ├── store/                 # Redux Toolkit store, feature slices & RTK Query
│   │   └── types/                 # Domain TypeScript interfaces
│   ├── .env.local                 # Frontend Environment Variables
│   ├── tailwind.config.ts         # Tailwind CSS styling configuration
│   └── package.json
└── README.md
```

---

## 👥 User Roles & Permissions

The platform enforces 3 strict tiers of Role-Based Access Control (RBAC) at both the **Server/API route middleware layer** and the **Client UI navigation layer**:

### 1. Executive Admin (`admin`)
* **Financial Analytics:** Total Registered Customers, Total Bank Accounts, Total Bank Balance, Total Deposits, Total Withdrawals, Total Processed Transactions, and Pending Loans.
* **Interactive Data Visualization:** Recharts bar charts, pie charts, and monthly volume trajectories.
* **Customer Governance:** View all customers, search directory, toggle active/inactive status, and block suspicious accounts.
* **Account Controls:** Create new bank accounts, freeze/unfreeze accounts, and set daily & per-transaction limits.
* **Loan Approvals:** Evaluate loan applications with staff notes, approve with automatic fund disbursement, or reject.
* **Bank-Wide Audit:** Full ledger access with filtering, search, and official PDF receipt generation.

### 2. Bank Staff (`staff`)
* **Customer Onboarding:** Register new customers and open initial bank accounts with counter deposits.
* **Transaction Compliance:** Inspect live transactions, filter by ID/date, and flag suspicious transactions for admin review.
* **Cashier Authorizations:** Review, approve, or reject customer cash deposits and counter withdrawals with atomic ledger updates.
* **Loan Assistance:** Review customer loan files, inspect monthly income and employment, add internal verification notes, and forward to Admin. *(Staff are strictly prohibited from self-approving loans)*.

### 3. Customer (`customer`)
* **Multi-Account Switcher:** Seamlessly switch between Savings, Current, and Business accounts.
* **Instant Fund Transfers:** Transfer funds between own accounts or to another customer with recipient validation, server-side balance validation, and 4-digit Transaction PIN authorization.
* **Deposit & Withdrawal Requests:** Submit cashier requests for staff review.
* **Loan Services:** Interactive loan EMI calculator, loan application submission, and amortized repayment schedules with 1-click EMI payments.
* **Statement & Receipt Downloads:** Export official PDF account statements and transaction receipts on demand using jsPDF.

---

## ⚡ Redux Toolkit & RTK Query Architecture

Global state management is built on **Redux Toolkit (RTK)** and **RTK Query**:

1. **Centralized Store (`src/store/index.ts`):**
   * Configured with `configureStore` combining feature slices and the RTK Query middleware.
2. **Feature Slices (`src/store/slices/`):**
   * `authSlice.ts`: Manages authenticated user session, tokens, authentication status, and error states.
   * `accountSlice.ts`: Manages active accounts, selected account switching, and local balance sync.
   * `transactionSlice.ts`: Manages transaction filters (search, type, date range) and selected receipt modal.
   * `loanSlice.ts`: Manages active loans, selected loan repayment schedule, and loan filter criteria.
   * `uiSlice.ts`: Controls sidebar state, notification toasts, and active modal dialogs.
3. **RTK Query API Layer (`src/store/api/apiSlice.ts`):**
   * Automatic token injection into headers (`prepareHeaders`).
   * Automated Cache Invalidation via Tag Types: `['User', 'Account', 'Transaction', 'Loan', 'Request', 'Analytics', 'Customer']`.
   * For example, executing a fund transfer automatically invalidates `Account`, `Transaction`, and `Analytics` tags, triggering instant background re-fetching across all dashboard components.

---

## 🔒 Financial Business Logic & Security

* **Atomic Transactions & Race-Condition Safety:** Balance deductions use conditional atomic queries (`{ _id: senderId, balance: { $gte: transferAmount }, status: 'active' }`). If an account has insufficient funds or concurrent requests are fired, the transaction is rejected safely.
* **Server-Side Balance Validation:** The frontend never transmits calculated balances. The backend calculates all balances and debits/credits serverside.
* **Transaction PIN Security:** Transfers and loan repayments require a 4-to-6 digit PIN, hashed using `bcryptjs`.
* **Zero Frontend Trust:** Account ownership is strictly verified against the decoded JWT session before any debit or inquiry.

---

## 🗄 Database Schema Design

* **User (`User`):** `name`, `email` (unique), `password` (bcrypt), `role` (`admin` | `staff` | `customer`), `status`, `isBlocked`, `transactionPin`.
* **BankAccount (`BankAccount`):** `accountNumber` (unique), `userId` (ref: User), `accountType` (`Savings` | `Current` | `Business`), `balance`, `status` (`active` | `frozen` | `closed`), `dailyTransferLimit`, `perTransactionLimit`.
* **Transaction (`Transaction`):** `transactionId` (unique `TXN-YYYYMMDD-XXXXXX`), `type` (`fund_transfer` | `deposit` | `withdrawal` | `loan_disbursement` | `loan_repayment`), `senderAccountId`, `receiverAccountId`, `amount`, `fee`, `status`, `flaggedForReview`, `flagReason`.
* **Loan (`Loan`):** `userId`, `accountId`, `loanType`, `amount`, `approvedAmount`, `durationMonths`, `interestRate`, `status` (`pending` | `under_review` | `approved` | `active` | `completed`), `repaymentSchedule`, `repayments`.
* **DepositWithdrawRequest (`DepositWithdrawRequest`):** `userId`, `accountId`, `type`, `amount`, `status` (`pending` | `approved` | `rejected`), `reviewedBy`, `reviewNotes`.

---

## 🔑 Demo Credentials

| Role | Email | Password | Transaction PIN |
|---|---|---|---|
| **System Admin** | `admin@bank.com` | `Admin@1234` | `1234` |
| **Bank Staff** | `staff@bank.com` | `Staff@1234` | `1234` |
| **Customer (Primary)** | `customer@bank.com` | `Customer@1234` | `1234` |
| **Customer (Recipient)** | `sarah.jenkins@bank.com` | `Customer@1234` | `1234` |

> 💡 **Quick Sign-In:** The Login and Home pages feature **1-Click Demo Buttons** to automatically fill credentials for all three roles!

---

## ⚙ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.l46db0x.mongodb.net/banking_system?retryWrites=true&w=majority
JWT_SECRET=c5d1e2f49a88390b17e42d72bcf9215037d45a9678129e46fca05295c1a8e10b
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Local Setup & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **MongoDB**: Atlas Cluster URI or local MongoDB instance

### 1. Clone Repository
```bash
git clone https://github.com/your-username/advanced-digital-banking-management-system.git
cd "Advanced Digital Banking Management System"
```

### 2. Setup & Seed Backend
```bash
cd backend
npm install
npm run seed       # Seeds demo admin, staff, customers, accounts, loans & transactions
npm run dev        # Starts backend API on http://localhost:5000
```

### 3. Setup Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev        # Starts Next.js app on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser to test the platform.

---

## 🌐 Deployment Guide

### Deploy Backend (Render / Railway)
1. Push code to GitHub.
2. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app) pointing to the `backend` directory.
3. Add environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`).
4. Set Build Command: `npm install && npm run build` (or start directly with `node dist/server.js`).

### Deploy Frontend (Vercel)
1. Create a new project on [Vercel](https://vercel.com) and set the Root Directory to `frontend`.
2. Set Environment Variable: `NEXT_PUBLIC_API_URL` pointing to your deployed backend URL (e.g. `https://your-api.onrender.com/api`).
3. Deploy!
