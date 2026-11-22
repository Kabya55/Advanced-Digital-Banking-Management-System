'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import { useGetAccountsQuery, useCreateAccountMutation } from '@/store/api/apiSlice';
import { IBankAccount } from '@/types';
import {
  CreditCard,
  Plus,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  Calendar,
  Building2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export default function CustomerAccountsPage() {
  const { data: accounts = [], isLoading } = useGetAccountsQuery();
  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();

  const [openModal, setOpenModal] = useState(false);
  const [accountType, setAccountType] = useState('Current');
  const [initialDeposit, setInitialDeposit] = useState('500');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount({
        accountType,
        initialDeposit: Number(initialDeposit) || 0,
      }).unwrap();

      toast.success(`New ${accountType} Account opened successfully!`);
      setOpenModal(false);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to open account');
    }
  };

  const downloadStatement = (account: IBankAccount) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Apex Bank', 14, 22);
      doc.setFontSize(10);
      doc.text('OFFICIAL ACCOUNT STATEMENT & BALANCE AUDIT', 14, 32);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.text(`Account Number: ${account.accountNumber}`, 14, 55);
      doc.text(`Account Type: ${account.accountType} Account`, 14, 62);
      doc.text(`Available Balance: $${account.balance.toFixed(2)} USD`, 14, 69);
      doc.text(`Statement Generated: ${new Date().toLocaleString()}`, 14, 76);

      autoTable(doc, {
        startY: 85,
        head: [['Field', 'Account Specification']],
        body: [
          ['Account Number', account.accountNumber],
          ['Account Classification', account.accountType],
          ['Current Balance', `$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
          ['Currency', account.currency],
          ['Account Status', account.status.toUpperCase()],
          ['Daily Transfer Limit', `$${account.dailyTransferLimit.toLocaleString()}`],
          ['Per-Transaction Limit', `$${account.perTransactionLimit.toLocaleString()}`],
          ['Opened Date', new Date(account.createdAt).toLocaleDateString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('Apex Bank Core Banking System — Certified Account Document', 14, pageHeight - 15);

      doc.save(`Statement-${account.accountNumber}.pdf`);
      toast.success('Account statement PDF downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to generate PDF statement');
    }
  };

  return (
    <DashboardLayout allowedRoles={['customer']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Bank Accounts</h1>
            <p className="text-xs text-slate-500">
              Manage multi-currency and specialized banking accounts
            </p>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Open Additional Account</span>
          </button>
        </div>

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading accounts...
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{acc.accountType} Account</h3>
                      <p className="text-[11px] font-mono text-slate-500">{acc.accountNumber}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                      acc.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>

                <div className="py-2 border-y border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Current Balance</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Transfer Limit:</span>
                    <span className="font-semibold text-slate-800">
                      ${acc.dailyTransferLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Per-Txn Limit:</span>
                    <span className="font-semibold text-slate-800">
                      ${acc.perTransactionLimit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => downloadStatement(acc)}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Download PDF Statement</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Open Account Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Open Additional Bank Account</h3>
              <p className="text-xs text-slate-500">Choose account type and starting balance</p>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Savings">Savings Account (Interest Earning)</option>
                  <option value="Current">Current Account (Everyday Checking)</option>
                  <option value="Business">Business Account (Commercial & High Limits)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Deposit Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="w-1/3 py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-2/3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Opening Account...' : 'Confirm & Open'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
