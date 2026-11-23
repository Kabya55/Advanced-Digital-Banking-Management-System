'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import AccountCard from '@/components/customer/AccountCard';
import TransferModal from '@/components/customer/TransferModal';
import DepositWithdrawModal from '@/components/customer/DepositWithdrawModal';
import LoanApplicationModal from '@/components/customer/LoanApplicationModal';
import TransactionReceiptModal from '@/components/customer/TransactionReceiptModal';
import {
  useGetAccountsQuery,
  useGetTransactionsQuery,
  useGetCustomerAnalyticsQuery,
  useGetLoansQuery,
} from '@/store/api/apiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedAccount } from '@/store/slices/accountSlice';
import { ITransaction } from '@/types';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Wallet,
  TrendingUp,
  Receipt,
  Download,
  Loader2,
  Calendar,
  AlertCircle,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

export default function CustomerDashboard() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const { data: accounts = [], isLoading: accountsLoading } = useGetAccountsQuery();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const currentAccount =
    accounts.find((a) => a._id === selectedAccountId) || accounts[0];

  const { data: transactionsData, isLoading: txnsLoading } = useGetTransactionsQuery({
    limit: 8,
  });

  const { data: analytics } = useGetCustomerAnalyticsQuery();
  const { data: loans = [] } = useGetLoansQuery();

  // Modals state
  const [transferOpen, setTransferOpen] = useState(false);
  const [depositWithdrawOpen, setDepositWithdrawOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);
  const [selectedReceiptTxn, setSelectedReceiptTxn] = useState<ITransaction | null>(null);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalLoanBalance = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

  return (
    <DashboardLayout allowedRoles={['customer']}>
      <div className="space-y-6">
        {/* Welcome Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Customer'} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Apex Digital Banking Core • Personalized Financial Dashboard
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setTransferOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Send Funds</span>
            </button>

            <button
              onClick={() => setDepositWithdrawOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <span>Deposit / Withdraw</span>
            </button>

            <button
              onClick={() => setLoanOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Apply Loan</span>
            </button>
          </div>
        </div>

        {/* Account Pending Approval Banner */}
        {(user?.status === 'pending' || currentAccount?.status === 'pending') && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>Account Pending Verification & Approval</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-200 text-amber-900">
                    Awaiting Review
                  </span>
                </h4>
                <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Your registration is complete! A bank administrator or staff officer is verifying your identity. Outgoing transfers, deposits, and loan requests are locked until your account is approved.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-block px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold rounded-xl">
                Transactions Locked 🔒
              </span>
            </div>
          </div>
        )}

        {/* PIN Security Notice if customer has not set up PIN yet */}
        {!user?.hasPin && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Transaction PIN Not Set Up Yet!
                </h4>
                <p className="text-[11px] text-amber-700">
                  You need a 4-digit PIN to authorize fund transfers. (Default demo PIN is 1234).
                </p>
              </div>
            </div>
            <a
              href="/customer/profile"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Set PIN Now
            </a>
          </div>
        )}

        {/* High-Level Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Net Balance
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Across all your active accounts</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bank Accounts
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{accounts.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Savings, Current & Business</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Loans
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{activeLoans.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Outstanding: ${totalLoanBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Spending
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              ${analytics?.monthlySpending?.[analytics.monthlySpending.length - 1]?.amount?.toLocaleString() || '0.00'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">This current billing month</p>
          </div>
        </div>

        {/* Multi-Account Cards Switcher */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Your Bank Accounts ({accounts.length})
            </h3>
            <span className="text-xs text-slate-400">Click any card to switch active account</span>
          </div>

          {accountsLoading ? (
            <div className="h-44 flex items-center justify-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {accounts.map((acc) => (
                <AccountCard
                  key={acc._id}
                  account={acc}
                  isSelected={currentAccount?._id === acc._id}
                  onSelect={() => setSelectedAccountId(acc._id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Visual Charts: Spending and Breakdown */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Monthly Spending vs Deposits</h4>
              <p className="text-xs text-slate-500 mb-4">Historical 6-month financial trajectory</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="amount" name="Spending ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Transaction Types Distribution</h4>
              <p className="text-xs text-slate-500 mb-4">Breakdown of deposits, transfers & withdrawals</p>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.transactionDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.transactionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Financial Transactions</h3>
              <p className="text-xs text-slate-500">Live ledger of transfers, deposits & payments</p>
            </div>
            <a
              href="/customer/transfers"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All History →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {txnsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactionsData?.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactionsData?.transactions.map((txn) => {
                    const isDebit =
                      txn.type === 'withdrawal' ||
                      (txn.type === 'fund_transfer' &&
                        accounts.some((a) => a.accountNumber === txn.senderAccountNum)) ||
                      txn.type === 'loan_repayment';

                    return (
                      <tr key={txn._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                          {txn.transactionId}
                        </td>
                        <td className="py-3.5 px-4 capitalize font-medium text-slate-800">
                          {txn.type.replace('_', ' ')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">
                          {txn.description || 'Banking transaction'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </td>
                        <td
                          className={`py-3.5 px-4 font-bold ${
                            isDebit ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isDebit ? '-' : '+'}${txn.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
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
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedReceiptTxn(txn)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View / Download Receipt"
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
        </div>
      </div>

      {/* Modals */}
      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        accounts={accounts}
        onSuccess={(txn) => setSelectedReceiptTxn(txn)}
      />

      <DepositWithdrawModal
        isOpen={depositWithdrawOpen}
        onClose={() => setDepositWithdrawOpen(false)}
        accounts={accounts}
      />

      <LoanApplicationModal
        isOpen={loanOpen}
        onClose={() => setLoanOpen(false)}
        accounts={accounts}
      />

      <TransactionReceiptModal
        isOpen={!!selectedReceiptTxn}
        onClose={() => setSelectedReceiptTxn(null)}
        transaction={selectedReceiptTxn}
      />
    </DashboardLayout>
  );
}
