'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
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
  LayoutDashboard,
  LogOut,
  Zap,
  Globe,
  TrendingUp,
  Layers,
  ChevronDown,
  ShieldAlert,
  FileText,
  BadgeCheck,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const getDashboardUrl = (role?: string) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'staff') return '/staff/dashboard';
    return '/customer/dashboard';
  };

  const faqs = [
    {
      q: 'How does Apex Bank ensure fund transfer consistency and prevent race conditions?',
      a: 'All money transfers utilize atomic database operations. Both sender debit and recipient credit execute synchronously within isolated server transactions. A transfer will never deduct funds without successfully crediting the recipient.',
    },
    {
      q: 'Can bank staff approve their own loans or modify bank-wide settings?',
      a: 'No. The system enforces strict 3-tier Role-Based Access Control (RBAC). Bank Staff can onboard customers, review requests, and flag transactions, but only Executive Administrators have authorization to approve loans, adjust limits, or modify global settings.',
    },
    {
      q: 'How does the 4-digit Transaction PIN protect customer accounts?',
      a: 'Every fund transfer requires client-side entry and server-side verification of a cryptographic 4-digit PIN. Front-end balance manipulation is strictly impossible because all balance checks and validations occur server-side.',
    },
    {
      q: 'What transaction reports and account statements can customers export?',
      a: 'Customers can generate and download official digital PDF account statements with complete chronological transaction ledgers, as well as instant receipt documents for each fund transfer and deposit.',
    },
  ];

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

        {/* Right side Auth Controls */}
        {isAuthenticated && user ? (
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-right">
              <div>
                <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                  {user.role === 'admin'
                    ? 'Admin'
                    : user.role === 'staff'
                    ? 'Bank Staff'
                    : 'Customer'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <Link
              href={getDashboardUrl(user.role)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Link>

            <button
              onClick={() => {
                dispatch(logout());
                toast.success('Logged out successfully');
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
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
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        {isAuthenticated && user && (
          <div className="mb-8 max-w-lg mx-auto p-3.5 sm:p-4 rounded-2xl bg-indigo-950/70 border border-indigo-500/50 backdrop-blur-md flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Signed in as {user.name}</p>
                <p className="text-[11px] text-indigo-300">{user.email} • {user.role.toUpperCase()} PORTAL</p>
              </div>
            </div>
            <Link
              href={getDashboardUrl(user.role)}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300 mb-6 animate-pulse">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next-Generation Digital Banking & Financial Core Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight sm:leading-tight">
          Next-Gen Banking with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            Atomic Fund Transfers
          </span>{' '}
          & Role-Based Security
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto mt-6 leading-relaxed">
          A production-grade digital financial ecosystem built with Next.js App Router, Redux Toolkit,
          RTK Query, and strict server-side transaction consistency. Designed for personal wealth and
          commercial institutional governance.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>Open Bank Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In to Portal</span>
          </Link>
        </div>

        {/* Real-time Platform Key Indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">$142M+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Settled Volume</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">99.99%</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">System Uptime</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">&lt; 1.2s</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Transfer Latency</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-purple-400">3-Tier</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Role Security</p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Core Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Built for Absolute Transaction Certainty</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-2">Atomic Fund Transfers</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Server-side balance validation, 4-digit PIN verification, and race-condition safe transfers across bank accounts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-2">Loan Lifecycle & Repayments</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete loan applications, staff verification notes, admin approval, and automated installment amortization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-2">Financial Analytics</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive charts displaying monthly volume, deposits vs withdrawals, and account distribution metrics.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-2">3-Tier RBAC & Compliance</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict route protection across Admin, Bank Staff, and Customer at both serverless API and UI layers.
            </p>
          </div>
        </div>
      </section>

      {/* NEW SECTION 1: Account Types & Banking Products Showcase */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Product Portfolio</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Tailored Account Tiers for Every Financial Goal
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Seamlessly switch between multiple accounts under a single profile with dedicated balances, limits, and statements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Savings Account */}
          <div className="p-7 rounded-3xl bg-slate-800/50 border border-slate-700/80 hover:border-indigo-500/60 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                4.85% APY
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">Savings Account</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              High-yield wealth accumulation with automated daily compounding interest and zero maintenance fees.
            </p>
            <ul className="mt-6 space-y-3 text-xs text-slate-300 border-t border-slate-700/50 pt-5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Daily interest compounding & monthly payout</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero minimum balance penalties</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant withdrawal request simulation</span>
              </li>
            </ul>
          </div>

          {/* Current / Checking Account */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-indigo-950/60 to-slate-800/60 border border-indigo-500/50 shadow-xl shadow-indigo-950/50 hover:border-indigo-400 transition-all hover:-translate-y-1 relative group">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              Most Popular
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Zero Fees
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">Current Account</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Everyday fluid digital banking with unlimited zero-fee fund transfers and real-time transaction tracking.
            </p>
            <ul className="mt-6 space-y-3 text-xs text-slate-200 border-t border-indigo-800/50 pt-5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited intra-bank fund transfers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>4-digit transaction PIN protection</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant PDF receipt generation</span>
              </li>
            </ul>
          </div>

          {/* Business Pro Account */}
          <div className="p-7 rounded-3xl bg-slate-800/50 border border-slate-700/80 hover:border-purple-500/60 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Enterprise
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">Business Account</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Commercial treasury management with higher transaction limits, payroll disbursements, and corporate financing.
            </p>
            <ul className="mt-6 space-y-3 text-xs text-slate-300 border-t border-slate-700/50 pt-5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>High-volume daily transfer allowances</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full commercial loan eligibility & review</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Comprehensive audit & statement export</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* NEW SECTION 2: Enterprise Security Architecture */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Security Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 leading-tight">
              Institutional-Grade Financial Integrity at Every Layer
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              Apex Bank implements rigorous server-side verification. Financial state is never modified directly from client payloads, guaranteeing ledger integrity and preventing unauthorized capital movements.
            </p>

            <div className="mt-8 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Cryptographic Transaction PIN</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Every capital transfer is authenticated using hashed PIN validation, preventing unauthorized session exploits.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Server-Side Atomic Ledger</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Balance updates occur inside single-transaction scopes. Failed transfers never result in dangling debits.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Anomalous Activity Flagging</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Bank staff actively audit transfers and flag suspicious activities for executive admin freeze and review.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Visual Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-400 font-semibold">SECURITY ENGINE: ACTIVE</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">TLS 1.3 / AES-256</span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Ledger Consistency:</span>
                <span className="text-indigo-400 font-semibold">Strict ACID</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Authorization Token:</span>
                <span className="text-emerald-400 font-semibold">Stateless HS256 JWT</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">PIN Verification:</span>
                <span className="text-purple-400 font-semibold">Bcrypt Salted Hash</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Customer Isolation:</span>
                <span className="text-white font-semibold">Enforced Server-Side</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                Zero-Trust Compliance
              </span>
              <span>Audited 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION 3: Frequently Asked Questions & Final Call To Action */}
      <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Help & Governance</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Key operational details about the platform architecture, transactions, and security models.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-800/40 border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-indigo-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 border-t border-slate-800/60 pt-3 leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final Conversion Call To Action */}
        <div className="mt-20 p-10 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900 border border-indigo-500/40 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Ready to Experience Next-Gen Digital Banking?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-3 leading-relaxed">
              Open your digital account in less than 3 minutes or sign in to access your comprehensive financial operations suite.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Open an Account Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In to Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <span className="font-bold text-slate-300">ApexBank Core System</span>
          </div>
          <p>© 2026 Apex Bank Management System — Enterprise Digital Banking Architecture</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
