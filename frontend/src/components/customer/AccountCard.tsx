'use client';

import React from 'react';
import { IBankAccount } from '@/types';
import { Copy, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AccountCardProps {
  account: IBankAccount;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function AccountCard({ account, isSelected, onSelect }: AccountCardProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    toast.success('Account number copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'Business':
        return 'from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30';
      case 'Current':
        return 'from-blue-900 via-sky-950 to-slate-900 text-white border-sky-500/30';
      default:
        return 'from-indigo-900 via-purple-950 to-slate-900 text-white border-purple-500/30';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl p-6 bg-gradient-to-br ${getGradient(
        account.accountType
      )} shadow-xl border cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-indigo-300" />
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">
            {account.accountType} Account
          </span>
        </div>
        <span
          className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full tracking-wider ${
            account.status === 'active'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {account.status}
        </span>
      </div>

      <div className="mb-6">
        <p className="text-xs text-slate-300 font-medium mb-1">Available Balance</p>
        <div className="flex items-baseline space-x-1">
          <span className="text-xl font-light text-slate-400">$</span>
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {account.balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Account Number</p>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="font-mono text-sm tracking-wider font-medium text-white">
              {account.accountNumber}
            </span>
            <button
              onClick={copyToClipboard}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Copy Account Number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Daily Limit</p>
          <p className="font-mono text-xs text-slate-200 mt-0.5">
            ${account.dailyTransferLimit.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
