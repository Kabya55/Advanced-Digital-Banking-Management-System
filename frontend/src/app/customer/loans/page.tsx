'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import LoanApplicationModal from '@/components/customer/LoanApplicationModal';
import {
  useGetLoansQuery,
  useGetAccountsQuery,
  useRepayLoanInstallmentMutation,
} from '@/store/api/apiSlice';
import { ILoan, IRepaymentScheduleItem } from '@/types';
import {
  CreditCard,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  DollarSign,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerLoansPage() {
  const { data: accounts = [] } = useGetAccountsQuery();
  const { data: loans = [], isLoading } = useGetLoansQuery();
  const [repayInstallment, { isLoading: isRepaying }] = useRepayLoanInstallmentMutation();

  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<ILoan | null>(null);

  // Repayment Modal
  const [repayModalItem, setRepayModalItem] = useState<{
    loan: ILoan;
    item: IRepaymentScheduleItem;
  } | null>(null);
  const [repayAccountId, setRepayAccountId] = useState('');
  const [repayPin, setRepayPin] = useState('');

  const activeLoan = selectedLoan || loans.find((l) => l.status === 'active') || loans[0];

  const handleConfirmRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModalItem) return;

    try {
      await repayInstallment({
        loanId: repayModalItem.loan._id,
        installmentNumber: repayModalItem.item.installmentNumber,
        accountId: repayAccountId || accounts[0]?._id,
        pin: repayPin,
      }).unwrap();

      toast.success(
        `Installment #${repayModalItem.item.installmentNumber} paid successfully! Balance debited.`
      );
      setRepayModalItem(null);
      setRepayPin('');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Repayment failed');
    }
  };

  return (
    <DashboardLayout allowedRoles={['customer']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Loan Management System
            </h1>
            <p className="text-xs text-slate-500">
              View active loans, amortized repayment schedules, and apply for financing
            </p>
          </div>

          <button
            onClick={() => setLoanModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for New Loan</span>
          </button>
        </div>

        {/* Loans Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading loan profiles...
            </div>
          ) : loans.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No Active Loans</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You do not have any active loan accounts. You can apply for personal, business, or
                home financing in minutes.
              </p>
              <button
                onClick={() => setLoanModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Apply Now
              </button>
            </div>
          ) : (
            loans.map((loan) => (
              <div
                key={loan._id}
                onClick={() => setSelectedLoan(loan)}
                className={`p-6 bg-white rounded-2xl border cursor-pointer transition-all ${
                  activeLoan?._id === loan._id
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200/80 shadow-sm hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-indigo-600">
                    {loan.loanType} Loan
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                      loan.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : loan.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : loan.status === 'under_review'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {loan.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Remaining Balance</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    ${loan.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Approved Principal:</span>
                    <span className="font-semibold text-slate-800">${loan.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly EMI:</span>
                    <span className="font-semibold text-indigo-600">${loan.monthlyInstallment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-semibold text-slate-800">{loan.durationMonths} Months</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Loan Detailed Repayment Schedule */}
        {activeLoan && activeLoan.repaymentSchedule?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Repayment Schedule — {activeLoan.loanType} Loan (#{activeLoan._id.slice(-6)})
                </h3>
                <p className="text-xs text-slate-500">
                  Fixed monthly installments with automatic balance debit
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Monthly Installment: </span>
                <span className="text-sm font-bold text-slate-900">
                  ${activeLoan.monthlyInstallment.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4"># Installment</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Paid On</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeLoan.repaymentSchedule.map((item) => (
                    <tr key={item.installmentNumber} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        Installment {item.installmentNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{item.dueDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${item.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                            item.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {item.paidDate ? new Date(item.paidDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.status === 'unpaid' ? (
                          <button
                            onClick={() => {
                              setRepayModalItem({ loan: activeLoan, item });
                              setRepayAccountId(accounts[0]?._id || '');
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                          >
                            Pay EMI
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center justify-end space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pay Installment Modal */}
      {repayModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                Pay Installment #{repayModalItem.item.installmentNumber}
              </h3>
              <button
                onClick={() => setRepayModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRepayment} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Installment Amount:</span>
                  <span className="text-sm font-bold text-slate-900">
                    ${repayModalItem.item.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Loan Type:</span>
                  <span className="font-semibold text-indigo-700">{repayModalItem.loan.loanType}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Debit From Account
                </label>
                <select
                  value={repayAccountId}
                  onChange={(e) => setRepayAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountType} ({acc.accountNumber}) - ${acc.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Enter 4-Digit Transaction PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={repayPin}
                  onChange={(e) => setRepayPin(e.target.value)}
                  className="w-full text-center tracking-widest text-lg px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRepayModalItem(null)}
                  className="w-1/3 py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRepaying}
                  className="w-2/3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isRepaying ? 'Processing Payment...' : 'Authorize Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <LoanApplicationModal
        isOpen={loanModalOpen}
        onClose={() => setLoanModalOpen(false)}
        accounts={accounts}
      />
    </DashboardLayout>
  );
}
