'use client';

import React from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { useGetAdminAnalyticsQuery } from '@/store/api/apiSlice';
import {
  Users,
  Wallet,
  Landmark,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useGetAdminAnalyticsQuery();

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Banking Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Real-time liquidity, transaction volume, loan portfolios & financial analytics
          </p>
        </div>

        {/* 7 Required Admin KPI Summary Cards from specification */}
        {isLoading || !analytics ? (
          <div className="h-32 flex items-center justify-center bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Bank Balance */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg shadow-indigo-900/20 sm:col-span-2">
              <div className="flex items-center justify-between text-indigo-200 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Total Bank Liquid Reserves
                </span>
                <Landmark className="w-5 h-5 text-indigo-300" />
              </div>
              <p className="text-3xl font-black tracking-tight text-white">
                ${analytics.totalBankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-indigo-200 mt-2">
                Cumulative available deposits across all active customer accounts
              </p>
            </div>

            {/* 2. Total Registered Customers */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Customers
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{analytics.totalCustomers}</p>
              <p className="text-[11px] text-slate-500 mt-1">Verified banking accounts</p>
            </div>

            {/* 3. Total Bank Accounts */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Bank Accounts
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{analytics.totalAccounts}</p>
              <p className="text-[11px] text-slate-500 mt-1">Savings, Current, Business</p>
            </div>

            {/* 4. Total Deposits */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Deposits
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600">
                ${analytics.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Lifetime deposit volume</p>
            </div>

            {/* 5. Total Withdrawals */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Withdrawals
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-rose-600">
                ${analytics.totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Lifetime withdrawal volume</p>
            </div>

            {/* 6. Total Transactions */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Transactions
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{analytics.totalTransactions}</p>
              <p className="text-[11px] text-slate-500 mt-1">Processed banking operations</p>
            </div>

            {/* 7. Pending Loan Applications */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pending Loans
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-amber-600">{analytics.pendingLoans}</p>
              <p className="text-[11px] text-slate-500 mt-1">Awaiting executive decision</p>
            </div>
          </div>
        )}

        {/* Recharts Data Visualizations */}
        {analytics && <AnalyticsCharts analytics={analytics} />}
      </div>
    </DashboardLayout>
  );
}
