'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import {
  useGetCustomersQuery,
  useUpdateCustomerStatusMutation,
  useGetCustomerByIdQuery,
} from '@/store/api/apiSlice';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Loader2,
  X,
  CreditCard,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useGetCustomersQuery({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const [updateStatus, { isLoading: isUpdating }] = useUpdateCustomerStatusMutation();

  const { data: details, isLoading: detailsLoading } = useGetCustomerByIdQuery(
    selectedCustomerId || '',
    { skip: !selectedCustomerId }
  );

  const handleToggleBlock = async (customerId: string, currentBlocked: boolean) => {
    try {
      await updateStatus({
        customerId,
        isBlocked: !currentBlocked,
      }).unwrap();

      toast.success(
        `Customer successfully ${!currentBlocked ? 'blocked' : 'unblocked'}!`
      );
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to update customer status');
    }
  };

  const handleToggleActive = async (customerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateStatus({
        customerId,
        status: nextStatus,
      }).unwrap();

      toast.success(`Customer status changed to ${nextStatus}!`);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to update customer status');
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Management
          </h1>
          <p className="text-xs text-slate-500">
            Search customers, inspect profiles & account history, activate/deactivate, or block suspicious accounts
          </p>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Standing</th>
                  <th className="py-3 px-4">Blocked</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No matching customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-3 px-4 text-slate-600">{c.email}</td>
                      <td className="py-3 px-4 text-slate-600">{c.phone || '—'}</td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{c.address || '—'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(c._id, c.status)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase transition-colors ${
                            c.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Click to toggle Active / Inactive"
                        >
                          {c.status}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            c.isBlocked
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.isBlocked ? 'Blocked' : 'Clear'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedCustomerId(c._id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Inspect Profile & Accounts"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleBlock(c._id, c.isBlocked)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              c.isBlocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            {c.isBlocked ? 'Unblock' : 'Block'}
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

      {/* Customer Full Inspection Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Comprehensive Audit: {details?.customer?.name}
                </h3>
                <p className="text-xs text-slate-500">{details?.customer?.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {detailsLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading customer accounts...
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Bank Accounts ({details?.accounts?.length || 0})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {details?.accounts?.map((acc) => (
                        <div key={acc._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-xs text-slate-800">
                              {acc.accountType}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800">
                              {acc.status}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-indigo-600 font-medium">{acc.accountNumber}</p>
                          <p className="text-lg font-bold text-slate-900 mt-2">
                            ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Customer Transaction Ledger (Last 10 Records)
                    </h4>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="p-2.5">TXN ID</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Amount</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {details?.transactions?.map((t) => (
                            <tr key={t._id}>
                              <td className="p-2.5 font-mono text-slate-700">{t.transactionId}</td>
                              <td className="p-2.5 capitalize">{t.type.replace('_', ' ')}</td>
                              <td className="p-2.5 font-bold">${t.amount.toFixed(2)}</td>
                              <td className="p-2.5 text-slate-500">
                                {new Date(t.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase bg-emerald-100 text-emerald-800">
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
