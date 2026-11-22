'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import {
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountStatusMutation,
  useUpdateAccountLimitsMutation,
  useGetCustomersQuery,
} from '@/store/api/apiSlice';
import { IBankAccount } from '@/types';
import { Wallet, Plus, Sliders, Snowflake, CheckCircle2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAccountsPage() {
  const { data: accounts = [], isLoading } = useGetAccountsQuery();
  const { data: customers = [] } = useGetCustomersQuery();

  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateAccountStatusMutation();
  const [updateLimits, { isLoading: isUpdatingLimits }] = useUpdateAccountLimitsMutation();

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [initialDeposit, setInitialDeposit] = useState('1000');

  // Limits Modal
  const [limitsModalAccount, setLimitsModalAccount] = useState<IBankAccount | null>(null);
  const [dailyLimit, setDailyLimit] = useState('');
  const [perTxnLimit, setPerTxnLimit] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    try {
      await createAccount({
        userId: selectedCustomerId,
        accountType,
        initialDeposit: Number(initialDeposit) || 0,
      }).unwrap();

      toast.success('Bank account created successfully!');
      setCreateModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to create account');
    }
  };

  const handleToggleFreeze = async (account: IBankAccount) => {
    const newStatus = account.status === 'active' ? 'frozen' : 'active';
    try {
      await updateStatus({
        accountId: account._id,
        status: newStatus,
      }).unwrap();

      toast.success(
        `Account #${account.accountNumber} has been ${
          newStatus === 'frozen' ? 'frozen' : 'unfrozen & activated'
        }!`
      );
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to update account status');
    }
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitsModalAccount) return;

    try {
      await updateLimits({
        accountId: limitsModalAccount._id,
        dailyLimit: Number(dailyLimit),
        perTxnLimit: Number(perTxnLimit),
      }).unwrap();

      toast.success('Account transaction limits updated successfully!');
      setLimitsModalAccount(null);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to update limits');
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bank Account Management
            </h1>
            <p className="text-xs text-slate-500">
              Create bank accounts, freeze/unfreeze accounts, and set strict daily transaction limits
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedCustomerId(customers[0]?._id || '');
              setCreateModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bank Account</span>
          </button>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">Available Balance</th>
                  <th className="py-3 px-4">Daily Limit</th>
                  <th className="py-3 px-4">Per-Txn Limit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading accounts...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {acc.accountNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {(acc.userId as any)?.name || 'Customer'}
                      </td>
                      <td className="py-3 px-4 font-medium text-indigo-600">{acc.accountType}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        ${acc.dailyTransferLimit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        ${acc.perTransactionLimit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                            acc.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {acc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setLimitsModalAccount(acc);
                              setDailyLimit(String(acc.dailyTransferLimit));
                              setPerTxnLimit(String(acc.perTransactionLimit));
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Configure Transaction Limits"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleFreeze(acc)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              acc.status === 'active'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {acc.status === 'active' ? 'Freeze' : 'Unfreeze'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Create Bank Account (Admin)</h3>
              <p className="text-xs text-slate-500">Create and assign account to customer</p>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current Account</option>
                  <option value="Business">Business Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Deposit ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="w-1/3 py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-2/3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Limits Modal */}
      {limitsModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Configure Transaction Limits
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Account #{limitsModalAccount.accountNumber}
                </p>
              </div>
              <button
                onClick={() => setLimitsModalAccount(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLimits} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Daily Transfer Limit ($)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Per-Transaction Limit ($)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={perTxnLimit}
                  onChange={(e) => setPerTxnLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLimitsModalAccount(null)}
                  className="w-1/3 py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingLimits}
                  className="w-2/3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isUpdatingLimits ? 'Saving...' : 'Update Limits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
