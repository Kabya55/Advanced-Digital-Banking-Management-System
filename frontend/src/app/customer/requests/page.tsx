'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import DepositWithdrawModal from '@/components/customer/DepositWithdrawModal';
import { useGetRequestsQuery, useGetAccountsQuery } from '@/store/api/apiSlice';
import {
  Landmark,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

export default function CustomerRequestsPage() {
  const { data: accounts = [] } = useGetAccountsQuery();
  const { data: requests = [], isLoading } = useGetRequestsQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'deposit' | 'withdrawal'>('deposit');

  return (
    <DashboardLayout allowedRoles={['customer']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Deposit & Withdrawal Requests
            </h1>
            <p className="text-xs text-slate-500">
              Submit counter deposit and withdrawal requests for bank officer approval
            </p>
          </div>

          <div className="flex space-x-2.5">
            <button
              onClick={() => {
                setModalType('deposit');
                setModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Deposit Request</span>
            </button>

            <button
              onClick={() => {
                setModalType('withdrawal');
                setModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdrawal Request</span>
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Request Type</th>
                  <th className="py-3.5 px-4">Account Number</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Date Submitted</th>
                  <th className="py-3.5 px-4">Review Notes</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No deposit or withdrawal requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 font-bold uppercase text-[11px] ${
                            req.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {req.type === 'deposit' ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          <span>{req.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {(req.accountId as any)?.accountNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ${req.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">
                        {req.description || 'Counter request'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic">
                        {req.reviewNotes || 'Pending staff review'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DepositWithdrawModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        accounts={accounts}
        defaultType={modalType}
      />
    </DashboardLayout>
  );
}
