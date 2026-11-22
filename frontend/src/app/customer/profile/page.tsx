'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import { useSetTransactionPinMutation, useGetMeQuery } from '@/store/api/apiSlice';
import { useAppSelector } from '@/store/hooks';
import { KeyRound, ShieldCheck, User, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: meData } = useGetMeQuery();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [setPinMutation, { isLoading }] = useSetTransactionPinMutation();

  const hasPin = meData?.hasPin ?? user?.hasPin;

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      toast.error('PIN must be 4 to 6 numeric digits');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('New PIN and Confirm PIN do not match');
      return;
    }

    try {
      await setPinMutation({
        pin: newPin,
        currentPin: hasPin ? currentPin : undefined,
      }).unwrap();

      toast.success('Transaction PIN successfully updated!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to update PIN');
    }
  };

  return (
    <DashboardLayout allowedRoles={['customer']}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Security & Profile Settings
          </h1>
          <p className="text-xs text-slate-500">
            Manage your personal profile and configure your 4-digit Transaction Authorization PIN
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Customer Account Details</span>
            </h3>

            <div className="space-y-3 text-xs pt-2">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
                  Full Name
                </span>
                <span className="font-semibold text-slate-800 text-sm">{user?.name}</span>
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
                  Email Address
                </span>
                <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
                  Phone Number
                </span>
                <span className="font-semibold text-slate-800">{user?.phone || 'Not provided'}</span>
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
                  Residential Address
                </span>
                <span className="font-semibold text-slate-800">{user?.address || 'Not provided'}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Account Standing:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  Active & Verified
                </span>
              </div>
            </div>
          </div>

          {/* Transaction PIN Management */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Transaction PIN</span>
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  hasPin
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasPin ? 'PIN Active' : 'Not Configured'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Your PIN is required for fund transfers and loan repayments. It is stored using secure
              bcrypt hashing.
            </p>

            <form onSubmit={handleSavePin} className="space-y-3 pt-2">
              {hasPin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Current PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="••••"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="w-full text-center tracking-widest px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5 text-center">
                    (Demo default PIN is 1234)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  New 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full text-center tracking-widest px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full text-center tracking-widest px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving PIN...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Update Transaction PIN</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
