'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import StaffCustomerModal from '@/components/staff/StaffCustomerModal';
import { useGetCustomersQuery, useGetCustomerByIdQuery } from '@/store/api/apiSlice';
import { IUser } from '@/types';
import { Users, Search, UserPlus, Eye, CreditCard, ArrowLeftRight, Loader2, X } from 'lucide-react';

export default function StaffCustomersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useGetCustomersQuery({
    search: search || undefined,
  });

  const { data: details, isLoading: detailsLoading } = useGetCustomerByIdQuery(
    selectedCustomerId || '',
    { skip: !selectedCustomerId }
  );

  return (
    <DashboardLayout allowedRoles={['staff']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Directory</h1>
            <p className="text-xs text-slate-500">
              Verify customer identities, view accounts, and onboard new depositors
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Customer</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
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
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Accounts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading customer directory...
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
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                        {c.address || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                            c.isBlocked
                              ? 'bg-rose-100 text-rose-800'
                              : c.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.isBlocked ? 'Blocked' : c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedCustomerId(c._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Customer Bank Accounts"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Customer Profile & Accounts: {details?.customer?.name}
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
                  Loading accounts...
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Bank Accounts ({details?.accounts?.length || 0})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <p className="font-mono text-xs text-indigo-600 font-medium">
                            {acc.accountNumber}
                          </p>
                          <p className="text-lg font-bold text-slate-900 mt-2">
                            ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Recent Activity
                    </h4>
                    <div className="space-y-2 text-xs">
                      {details?.transactions?.slice(0, 5).map((t) => (
                        <div
                          key={t._id}
                          className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 capitalize">
                              {t.type.replace('_', ' ')}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {new Date(t.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">${t.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <StaffCustomerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </DashboardLayout>
  );
}
