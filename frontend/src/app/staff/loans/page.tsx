'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import { useGetLoansQuery, useReviewLoanMutation } from '@/store/api/apiSlice';
import { ILoan } from '@/types';
import { CreditCard, FileCheck, Loader2, X, MessageSquare, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffLoansPage() {
  const { data: loans = [], isLoading } = useGetLoansQuery();
  const [reviewLoan, { isLoading: isUpdating }] = useReviewLoanMutation();

  const [selectedLoan, setSelectedLoan] = useState<ILoan | null>(null);
  const [notes, setNotes] = useState('');

  const handleForwardToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      await reviewLoan({
        loanId: selectedLoan._id,
        action: 'under_review',
        staffNotes: notes.trim() || 'Verified by Bank Staff: Documents valid and verified.',
      }).unwrap();

      toast.success(
        'Loan application verified, internal notes added, and forwarded to Admin for approval!'
      );
      setSelectedLoan(null);
      setNotes('');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to update loan');
    }
  };

  return (
    <DashboardLayout allowedRoles={['staff']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loan Assistance Desk</h1>
          <p className="text-xs text-slate-500">
            Review customer applications, verify financial qualifications, add staff internal notes,
            and forward to Admin
          </p>
        </div>

        {/* Notice regarding staff permissions as specified in prompt */}
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
          <p>
            <span className="font-bold">Staff Compliance Rule:</span> Bank Staff can add internal
            verification notes and advance loans to &quot;Under Review&quot;, but final loan approval
            and disbursement is strictly reserved for Executive Admin.
          </p>
        </div>

        {/* Loans Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Monthly Income</th>
                  <th className="py-3 px-4">Employment</th>
                  <th className="py-3 px-4">Staff Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Assist Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading loan files...
                    </td>
                  </tr>
                ) : loans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No loan applications submitted yet.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {(loan.userId as any)?.name || 'Applicant'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-700">{loan.loanType}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${loan.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{loan.durationMonths} Mo</td>
                      <td className="py-3 px-4 text-slate-600">
                        ${loan.monthlyIncome.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {loan.employmentStatus}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic truncate max-w-xs">
                        {loan.staffNotes || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                            loan.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : loan.status === 'under_review'
                              ? 'bg-indigo-100 text-indigo-800'
                              : loan.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {loan.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {loan.status === 'pending' || loan.status === 'under_review' ? (
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setNotes(loan.staffNotes || '');
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Add Note & Forward
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 capitalize">
                            {loan.status}
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

      {/* Staff Notes & Forward Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                Loan Assistance: {(selectedLoan.userId as any)?.name}
              </h3>
              <button
                onClick={() => setSelectedLoan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleForwardToAdmin} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p>
                  <span className="text-slate-500">Requested Amount:</span>{' '}
                  <span className="font-bold text-slate-900">
                    ${selectedLoan.amount.toLocaleString()} ({selectedLoan.loanType})
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Monthly Income:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    ${selectedLoan.monthlyIncome.toLocaleString()}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Employment:</span>{' '}
                  <span className="text-slate-700">{selectedLoan.employmentStatus}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Internal Verification Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Verified income statements and tax returns. Debt-to-income ratio is 28%. Forwarded to Admin."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="w-1/3 py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-2/3 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isUpdating ? (
                    'Forwarding...'
                  ) : (
                    <>
                      <span>Forward to Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
