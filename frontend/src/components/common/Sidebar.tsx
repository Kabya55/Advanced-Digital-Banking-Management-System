'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Landmark,
  FileText,
  Users,
  ShieldCheck,
  CreditCard,
  Settings,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertOctagon,
  FileCheck,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  const role = user?.role || 'customer';

  const customerNav = [
    { label: 'Overview', href: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'My Accounts', href: '/customer/accounts', icon: Wallet },
    { label: 'Fund Transfer', href: '/customer/transfers', icon: ArrowLeftRight },
    { label: 'Deposit & Withdrawal', href: '/customer/requests', icon: Landmark },
    { label: 'Loan Services', href: '/customer/loans', icon: CreditCard },
    { label: 'Security & PIN', href: '/customer/profile', icon: ShieldCheck },
  ];

  const staffNav = [
    { label: 'Officer Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    { label: 'Customer Accounts', href: '/staff/customers', icon: Users },
    { label: 'Transaction Audit', href: '/staff/transactions', icon: ArrowLeftRight },
    { label: 'Requests Review', href: '/staff/requests', icon: Clock },
    { label: 'Loan Verification', href: '/staff/loans', icon: FileCheck },
  ];

  const adminNav = [
    { label: 'Executive Analytics', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Customer Directory', href: '/admin/customers', icon: Users },
    { label: 'Account Controls', href: '/admin/accounts', icon: Wallet },
    { label: 'Bank Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
    { label: 'Loan Approvals', href: '/admin/loans', icon: CreditCard },
    { label: 'Deposit / Withdraw', href: '/admin/requests', icon: Landmark },
  ];

  const navItems = role === 'admin' ? adminNav : role === 'staff' ? staffNav : customerNav;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col justify-between border-r border-slate-800`}
    >
      <div className="flex-1 py-6 px-4 overflow-y-auto">
        <div className="px-2 mb-6">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {role === 'admin'
              ? 'Administrator Portal'
              : role === 'staff'
              ? 'Bank Staff Operations'
              : 'Customer Banking'}
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>256-bit Encrypted</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Role-Based Access Control enforced at API layer.
          </p>
        </div>
      </div>
    </aside>
  );
}
