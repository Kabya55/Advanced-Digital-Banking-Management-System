'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import TransferModal from '@/components/customer/TransferModal';
import TransactionReceiptModal from '@/components/customer/TransactionReceiptModal';
import { useGetAccountsQuery, useGetTransactionsQuery } from '@/store/api/apiSlice';
import { ITransaction } from '@/types';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  Receipt,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function CustomerTransfersPage() {
  const { data: accounts = [] } = useGetAccountsQuery();
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedReceiptTxn, setSelectedReceiptTxn] = useState<ITransaction | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data: txnsData, isLoading } = useGetTransactionsQuery({
    search: search || undefined,
    type: type !== 'all' ? type : undefined,
    status: status !== 'all' ? status : undefined,
    page,
    limit: 10,
  });

  return (
    <DashboardLayout allowedRoles={['customer']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fund Transfers</h1>
            <p className="text-xs text-slate-500">
              Transfer funds between accounts or to another customer within Apex Bank
            </p>
          </div>

          <button
            onClick={() => setTransferOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Make a Transfer</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Transaction ID or account..."
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
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading transfer records...
                    </td>
                  </tr>
                ) : txnsData?.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No matching transaction records found.
                    </td>
                  </tr>
                ) : (
                  txnsData?.transactions.map((txn) => {
                    const isDebit =
                      txn.type === 'withdrawal' ||
                      (txn.type === 'fund_transfer' &&
                        accounts.some((a) => a.accountNumber === txn.senderAccountNum)) ||
                      txn.type === 'loan_repayment';

                    return (
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
                          {txn.description || 'Fund transfer'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(txn.createdAt).toLocaleString()}
                        </td>
                        <td
                          className={`py-3 px-4 font-bold ${
                            isDebit ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isDebit ? '-' : '+'}${txn.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                              txn.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {txn.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedReceiptTxn(txn)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Print / Download PDF Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {txnsData && txnsData.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {txnsData.page} of {txnsData.totalPages} ({txnsData.total} total transactions)
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= txnsData.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        accounts={accounts}
        onSuccess={(txn) => setSelectedReceiptTxn(txn)}
      />

      <TransactionReceiptModal
        isOpen={!!selectedReceiptTxn}
        onClose={() => setSelectedReceiptTxn(null)}
        transaction={selectedReceiptTxn}
      />
    </DashboardLayout>
  );
}
