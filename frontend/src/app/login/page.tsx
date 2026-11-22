'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '@/store/api/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { Building2, Lock, Mail, ArrowRight, Loader2, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [login, { isLoading }] = useLoginMutation();

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: res.user, token: res.token }));
      toast.success(`Welcome back, ${res.user.name}!`);

      if (res.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (res.user.role === 'staff') {
        router.push('/staff/dashboard');
      } else {
        router.push('/customer/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.data?.error || err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Apex<span className="text-indigo-400">Bank</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Sign In to Your Banking Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter credentials or select a 1-click Demo Persona below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-700/80">
          {/* 1-Click Persona Quick Selectors */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              ⚡ 1-Click Demo Credentials
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@bank.com', 'Admin@1234')}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-rose-500/20 hover:border-rose-500/50 border border-slate-600/50 text-left transition-all group"
              >
                <span className="block text-[10px] font-bold uppercase text-rose-400">Admin</span>
                <span className="block text-xs font-semibold text-slate-200 truncate">Executive</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('staff@bank.com', 'Staff@1234')}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-amber-500/20 hover:border-amber-500/50 border border-slate-600/50 text-left transition-all group"
              >
                <span className="block text-[10px] font-bold uppercase text-amber-400">Staff</span>
                <span className="block text-xs font-semibold text-slate-200 truncate">Officer</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('customer@bank.com', 'Customer@1234')}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-emerald-500/20 hover:border-emerald-500/50 border border-slate-600/50 text-left transition-all group"
              >
                <span className="block text-[10px] font-bold uppercase text-emerald-400">Customer</span>
                <span className="block text-xs font-semibold text-slate-200 truncate">Alexander</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don&apos;t have a bank account?{' '}
            <Link href="/register" className="font-semibold text-indigo-400 hover:underline">
              Open an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
