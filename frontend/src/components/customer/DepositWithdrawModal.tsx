'use client';

import React, { useState } from 'react';
import { IBankAccount } from '@/types';
import { useCreateDepositWithdrawRequestMutation } from '@/store/api/apiSlice';
import { X, ArrowDownRight, ArrowUpRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: IBankAccount[];
  defaultType?: 'deposit' | 'withdrawal';
}

export default function DepositWithdrawModal({
  isOpen,
  onClose,
  accounts,
  defaultType = 'deposit',
}: DepositWithdrawModalProps) {
  const [type, setType] = useState<'deposit' | 'withdrawal'>(defaultType);
  const [accountId, setAccountId] = useState(accounts[0]?._id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [createRequest, { isLoading }] = useCreateDepositWithdrawRequestMutation();

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a._id === accountId) || accounts[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    if (selectedAccount.status === 'pending') {
      toast.error('Your account is pending admin approval. Deposit & withdrawal requests are locked.');
      return;
    }

    if (selectedAccount.status !== 'active') {
      toast.error(`This account is ${selectedAccount.status}. Requests are not permitted.`);
      return;
    }

    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (type === 'withdrawal' && numAmount > selectedAccount.balance) {
      toast.error(`Insufficient balance. Available: $${selectedAccount.balance.toFixed(2)}`);
      return;
    }

    try {
      await createRequest({
        accountId: selectedAccount._id,
        type,
        amount: numAmount,
        description: description.trim(),
      }).unwrap();

      toast.success(
        `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} request submitted for bank staff approval!`
      );
      onClose();
      setAmount('');
      setDescription('');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Request submission failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {type === 'deposit' ? 'Submit Deposit Request' : 'Submit Withdrawal Request'}
            </h3>
            <p className="text-xs text-slate-500">Simulated banking cashier workflow</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Toggle Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('deposit')}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === 'deposit'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <span>Cash Deposit</span>
            </button>
            <button
              type="button"
              onClick={() => setType('withdrawal')}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === 'withdrawal'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              <span>Withdrawal</span>
            </button>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Bank Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountType} ({acc.accountNumber}) - Available: ${acc.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Request Amount ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Cashier Note
            </label>
            <input
              type="text"
              placeholder="e.g. Counter cash deposit, ATM withdrawal slip"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2">
            {selectedAccount?.status === 'pending' && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <p className="font-bold text-amber-900">Account Pending Approval</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Transactions and requests are locked until your account is approved by bank staff.
                </p>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading || selectedAccount?.status !== 'active'}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 text-white rounded-xl text-sm font-semibold shadow-lg transition-all ${
                selectedAccount?.status !== 'active'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : type === 'deposit'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : selectedAccount?.status === 'pending' ? (
                <span>Account Pending Approval (Locked)</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Request for Staff Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
