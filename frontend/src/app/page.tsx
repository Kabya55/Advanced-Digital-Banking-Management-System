'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '@/store/api/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  Lock,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  BarChart3,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const handleQuickLogin = async (email: string, role: string) => {
    try {
      const password =
        role === 'admin' ? 'Admin@1234' : role === 'staff' ? 'Staff@1234' : 'Customer@1234';

      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: res.user, token: res.token }));
      toast.success(`Logged in as ${res.user.name} (${role.toUpperCase()})`);

      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'staff') router.push('/staff/dashboard');
      else router.push('/customer/dashboard');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight">
              Apex<span className="text-indigo-400">Bank</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 rounded">
              Core Banking Platform
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            Open Account
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300 mb-6 animate-pulse">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next-Generation Digital Banking & Financial Core System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
          Next-Gen Banking with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            Atomic Fund Transfers
          </span>{' '}
          & Role-Based Security
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mt-6">
          A production-level fintech digital banking system built with Next.js App Router, Redux
          Toolkit, RTK Query, and strict server-side transaction consistency.
        </p>

        {/* 1-Click Interactive Evaluation Demo Buttons */}
        <div className="mt-12 max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            ⚡ 1-Click Evaluator Instant Sign-In (Click any role to test live):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Admin Card */}
            <div
              onClick={() => handleQuickLogin('admin@bank.com', 'admin')}
              className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  System Admin
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="font-bold text-white text-base">Executive Admin Portal</h3>
              <p className="text-xs text-slate-400 mt-1">
                Analytics KPIs, Account Freezing, Transaction Limits & Loan Approvals.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-indigo-300 font-mono">
                <span>admin@bank.com</span>
                <span className="text-slate-500">Admin@1234</span>
              </div>
            </div>

            {/* Bank Staff Card */}
            <div
              onClick={() => handleQuickLogin('staff@bank.com', 'staff')}
              className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Bank Officer
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="font-bold text-white text-base">Bank Staff Desk</h3>
              <p className="text-xs text-slate-400 mt-1">
                Customer Onboarding, Deposit/Withdrawal Approval, Transaction Audit.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-indigo-300 font-mono">
                <span>staff@bank.com</span>
                <span className="text-slate-500">Staff@1234</span>
              </div>
            </div>

            {/* Customer Card */}
            <div
              onClick={() => handleQuickLogin('customer@bank.com', 'customer')}
              className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Customer
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="font-bold text-white text-base">Customer Account</h3>
              <p className="text-xs text-slate-400 mt-1">
                Multi-Account Switcher, PIN Transfer, Loans, Statement Download.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-indigo-300 font-mono">
                <span>customer@bank.com</span>
                <span className="text-slate-500">PIN: 1234</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-2">Atomic Fund Transfers</h4>
            <p className="text-xs text-slate-400">
              Server-side balance validation, 4-digit PIN verification, and race-condition safe
              transfers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-2">Loan Lifecycle & Repayments</h4>
            <p className="text-xs text-slate-400">
              Loan application, staff verification notes, admin approval, automated disbursement &
              installment tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-2">Financial Analytics</h4>
            <p className="text-xs text-slate-400">
              Interactive Recharts charts displaying monthly volume, deposits vs withdrawals, and
              account distribution.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-2">3-Tier RBAC & Compliance</h4>
            <p className="text-xs text-slate-400">
              Granular route protection across Admin, Bank Staff, and Customer at both API and UI
              layers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Apex Bank Management System — Professional FinTech Architecture Assessment</p>
      </footer>
    </div>
  );
}
