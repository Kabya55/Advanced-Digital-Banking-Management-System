'use client';

import React, { useState } from 'react';
import { IBankAccount } from '@/types';
import { useApplyLoanMutation } from '@/store/api/apiSlice';
import { X, CreditCard, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: IBankAccount[];
}

export default function LoanApplicationModal({
  isOpen,
  onClose,
  accounts,
}: LoanApplicationModalProps) {
  const [accountId, setAccountId] = useState(accounts[0]?._id || '');
  const [loanType, setLoanType] = useState('Personal');
  const [amount, setAmount] = useState('10000');
  const [durationMonths, setDurationMonths] = useState('12');
  const [monthlyIncome, setMonthlyIncome] = useState('5000');
  const [employmentStatus, setEmploymentStatus] = useState('Full-time Employed');
  const [description, setDescription] = useState('');

  const [applyLoan, { isLoading }] = useApplyLoanMutation();

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const months = Number(durationMonths) || 12;
  const interestRate = 8.5;
  const monthlyRate = interestRate / 100 / 12;

  // EMI formula
  const calculatedEMI =
    numAmount > 0 && months > 0
      ? (
          (numAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
          (Math.pow(1 + monthlyRate, months) - 1)
        ).toFixed(2)
      : '0.00';

  const totalPayable = (Number(calculatedEMI) * months).toFixed(2);
  const totalInterest = (Number(totalPayable) - numAmount).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId) {
      toast.error('Please select an account for loan disbursement');
      return;
    }

    if (numAmount < 100) {
      toast.error('Minimum loan amount is $100');
      return;
    }

    try {
      await applyLoan({
        accountId,
        loanType,
        amount: numAmount,
        durationMonths: months,
        monthlyIncome: Number(monthlyIncome),
        employmentStatus,
        description: description.trim(),
      }).unwrap();

      toast.success('Loan application submitted successfully! It is now pending bank review.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error || 'Loan application failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Apply for a Bank Loan</h3>
            <p className="text-xs text-slate-500">Low fixed 8.5% annual interest rate</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Disbursement Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Disbursement Bank Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountType} ({acc.accountNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Loan Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Loan Category
              </label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Personal">Personal Loan</option>
                <option value="Home">Home Loan / Mortgage</option>
                <option value="Business">Business Capital Loan</option>
                <option value="Education">Education Loan</option>
                <option value="Vehicle">Vehicle / Auto Loan</option>
              </select>
            </div>

            {/* Requested Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Loan Amount ($)
              </label>
              <input
                type="number"
                min="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration (Months)
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="6">6 Months</option>
                <option value="12">12 Months (1 Year)</option>
                <option value="24">24 Months (2 Years)</option>
                <option value="36">36 Months (3 Years)</option>
                <option value="60">60 Months (5 Years)</option>
              </select>
            </div>

            {/* Monthly Income */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Monthly Income ($)
              </label>
              <input
                type="number"
                required
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Employment Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Employment Status
            </label>
            <input
              type="text"
              required
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Loan Purpose / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Purpose of Loan
            </label>
            <textarea
              rows={2}
              placeholder="Explain how the funds will be utilized..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Loan Repayment Estimate</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-100">
                <p className="text-[10px] text-slate-500 uppercase">Monthly EMI</p>
                <p className="text-sm font-bold text-indigo-600">${calculatedEMI}</p>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-100">
                <p className="text-[10px] text-slate-500 uppercase">Total Interest</p>
                <p className="text-sm font-bold text-slate-800">${totalInterest}</p>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-100">
                <p className="text-[10px] text-slate-500 uppercase">Total Payable</p>
                <p className="text-sm font-bold text-slate-800">${totalPayable}</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Loan Application...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Submit Loan Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
