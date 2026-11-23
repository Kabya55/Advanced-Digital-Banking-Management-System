'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRegisterMutation, bankingApi } from '@/store/api/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { Building2, User, Mail, Lock, Phone, MapPin, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [registerUser, { isLoading }] = useRegisterMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error('Name, email, and password are required');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        address: address.trim(),
      }).unwrap();

      dispatch(bankingApi.util.resetApiState());
      dispatch(setCredentials({ user: res.user, token: res.token }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('bank_token', res.token);
        document.cookie = `bank_auth_token=${res.token}; path=/; max-age=604800; SameSite=Lax;`;
      }
      toast.success(res.message || 'Account created successfully! Welcome to Apex Bank.');
      router.push('/customer/dashboard');
    } catch (err: any) {
      toast.error(err?.data?.error || err.message || 'Registration failed');
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
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Open a Bank Account</h2>
        <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Includes $1,000 Welcome Bonus Deposit!</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-700/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

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
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="+1 212 555 0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  City / Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="New York, NY"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  <span>Opening Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Claim $1,000</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
