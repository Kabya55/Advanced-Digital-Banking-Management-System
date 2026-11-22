'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import { useGetTransactionsQuery, useFlagTransactionMutation } from '@/store/api/apiSlice';
import {
  ArrowLeftRight,
  Search,
  Filter,
  AlertOctagon,
  CheckCircle2,
  Receipt,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function StaffTransactionsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Flag modal
  const [flagModalTxn, setFlagModalTxn] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');

  const { data: txnsData, isLoading } = useGetTransactionsQuery({
    search: search || undefined,
    type: type !== 'all' ? type : undefined,
    status: status !== 'all' ? status : undefined,
    page,
    limit: 15,
  });

  const [flagTransaction, { isLoading: isFlagging }] = useFlagTransactionMutation();

  const handleConfirmFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagModalTxn || !flagReason.trim()) {
      toast.error('Please enter a reason for flagging this transaction');
      return;
    }

    try {
      await flagTransaction({
        transactionId: flagModalTxn,
        flagReason: flagReason.trim(),
      }).unwrap();

      toast.success('Transaction flagged for executive admin review!');
      setFlagModalTxn(null);
      setFlagReason('');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to flag transaction');
    }
  };

  return (
    <DashboardLayout allowedRoles={['staff']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Transaction Compliance & Audit
          </h1>
          <p className="text-xs text-slate-500">
            Monitor banking transactions, filter by ID or date, and flag suspicious financial activities
          </p>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Transaction ID, sender, or receiver..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="fund_transfer">Fund Transfer</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="loan_disbursement">Loan Disbursement</option>
              <option value="loan_repayment">Loan Repayment</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">From Account</th>
                  <th className="py-3.5 px-4">To Account</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Flagged Status</th>
                  <th className="py-3.5 px-4 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading transactions...
                    </td>
                  </tr>
                ) : txnsData?.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No transactions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  txnsData?.transactions.map((txn) => (
                    <tr key={txn._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {txn.transactionId}
                      </td>
                      <td className="py-3 px-4 capitalize font-semibold text-slate-700">
                        {txn.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {txn.senderAccountNum || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-600 font-medium">
                        {txn.receiverAccountNum || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {txn.description || 'Transaction'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${txn.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {txn.flaggedForReview ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-rose-100 text-rose-800">
                            Flagged
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase bg-slate-100 text-slate-600">
                            Clear
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!txn.flaggedForReview ? (
                          <button
                            onClick={() => {
                              setFlagModalTxn(txn.transactionId);
                              setFlagReason('');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                          >
                            Flag Suspicious
                          </button>
                        ) : (
                          <span
                            className="text-[11px] text-rose-600 italic truncate max-w-xs inline-block"
                            title={txn.flagReason}
                          >
                            Under Review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Flag Modal */}
      {flagModalTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 text-rose-600">
                <AlertOctagon className="w-5 h-5" />
                <span>Flag Suspicious Transaction</span>
              </h3>
              <button
                onClick={() => setFlagModalTxn(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmFlag} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                You are flagging transaction{' '}
                <span className="font-mono font-bold text-slate-900">{flagModalTxn}</span> for
                compliance and anti-money laundering (AML) review by the Administrator.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason / Suspicious Indicator
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe suspicious behavior (e.g. rapid structuring, uncharacteristic volume, mismatch of beneficiary)..."
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFlagModalTxn(null)}
                  className="w-1/3 py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFlagging}
                  className="w-2/3 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  {isFlagging ? 'Flagging...' : 'Confirm Compliance Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
