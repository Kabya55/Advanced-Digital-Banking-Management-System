'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import StaffCustomerModal from '@/components/staff/StaffCustomerModal';
import {
  useGetRequestsQuery,
  useGetLoansQuery,
  useGetCustomersQuery,
  useGetTransactionsQuery,
  useReviewRequestMutation,
} from '@/store/api/apiSlice';
import {
  Users,
  Clock,
  CreditCard,
  ArrowLeftRight,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function StaffDashboard() {
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const { data: requests = [], isLoading: reqLoading } = useGetRequestsQuery({ status: 'pending' });
  const { data: loans = [] } = useGetLoansQuery();
  const { data: customers = [] } = useGetCustomersQuery();
  const { data: txnsData } = useGetTransactionsQuery({ flagged: true });

  const [reviewRequest, { isLoading: isReviewing }] = useReviewRequestMutation();

  const pendingLoans = loans.filter((l) => l.status === 'pending' || l.status === 'under_review');
  const flaggedTxns = txnsData?.transactions || [];

  const handleReview = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      await reviewRequest({
        requestId,
        action,
        reviewNotes: `Approved by Bank Staff on ${new Date().toLocaleDateString()}`,
      }).unwrap();

      toast.success(`Request ${action} successfully!`);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Review failed');
    }
  };

  return (
    <DashboardLayout allowedRoles={['staff']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bank Officer Operations Desk
            </h1>
            <p className="text-xs text-slate-500">
              Customer onboarding, cashier request approvals, transaction compliance & loan reviews
            </p>
          </div>

          <button
            onClick={() => setCustomerModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Customer</span>
          </button>
        </div>

        {/* Staff KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Requests
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{requests.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Deposits & withdrawals awaiting review</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Loans for Assistance
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{pendingLoans.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Requiring document notes & verification</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Customers
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{customers.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Registered in bank branch directory</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Flagged Transactions
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{flaggedTxns.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Compliance & fraud review flags</p>
          </div>
        </div>

        {/* Pending Cashier Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pending Cashier Requests ({requests.length})
              </h3>
              <p className="text-xs text-slate-500">
                Authorize counter deposit and withdrawal slips with atomic ledger updates
              </p>
            </div>
            <a href="/staff/requests" className="text-xs font-semibold text-indigo-600 hover:underline">
              All Requests →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reqLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading cashier requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No pending requests requiring review.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {(req.userId as any)?.name || 'Customer'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 font-bold uppercase text-[11px] ${
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
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {(req.accountId as any)?.accountNumber || '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${req.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {req.description || 'Counter slip'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleReview(req._id, 'approved')}
                            disabled={isReviewing}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(req._id, 'rejected')}
                            disabled={isReviewing}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                          >
                            Reject
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

      <StaffCustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
      />
    </DashboardLayout>
  );
}
