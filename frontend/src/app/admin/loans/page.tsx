'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import { useGetLoansQuery, useReviewLoanMutation } from '@/store/api/apiSlice';
import { ILoan } from '@/types';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoansPage() {
  const { data: loans = [], isLoading } = useGetLoansQuery();
  const [reviewLoan, { isLoading: isReviewing }] = useReviewLoanMutation();

  const [approveModalLoan, setApproveModalLoan] = useState<ILoan | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModalLoan) return;

    try {
      await reviewLoan({
        loanId: approveModalLoan._id,
        action: 'approved',
        approvedAmount: Number(approvedAmount) || approveModalLoan.amount,
        staffNotes: adminNote.trim() || 'Approved by Executive Admin',
      }).unwrap();

      toast.success(
        `Loan #${approveModalLoan._id.slice(-6)} approved and $${Number(
          approvedAmount
        ).toLocaleString()} disbursed into customer's bank account!`
      );
      setApproveModalLoan(null);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Loan approval failed');
    }
  };

  const handleReject = async (loanId: string) => {
    if (!confirm('Are you sure you want to reject this loan application?')) return;

    try {
      await reviewLoan({
        loanId,
        action: 'rejected',
        staffNotes: 'Rejected by Executive Admin',
      }).unwrap();

      toast.success('Loan application has been rejected');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to reject loan');
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Loan Governance & Approvals
          </h1>
          <p className="text-xs text-slate-500">
            Review loan applications, evaluate staff verification notes, approve with atomic disbursement, or reject
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
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Monthly Income</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Staff Review Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Executive Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading loan files...
                    </td>
                  </tr>
                ) : loans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No loan applications recorded.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {(loan.userId as any)?.name || 'Applicant'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-600">{loan.loanType}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${loan.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        ${loan.monthlyIncome.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{loan.durationMonths} Months</td>
                      <td className="py-3 px-4 text-slate-500 italic truncate max-w-xs">
                        {loan.staffNotes || 'No staff notes'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                            loan.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : loan.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : loan.status === 'under_review'
                              ? 'bg-indigo-100 text-indigo-800'
                              : loan.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {loan.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {loan.status === 'pending' || loan.status === 'under_review' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setApproveModalLoan(loan);
                                setApprovedAmount(String(loan.amount));
                                setAdminNote('');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                            >
                              Approve & Disburse
                            </button>
                            <button
                              onClick={() => handleReject(loan._id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 capitalize">
                            Decision Finalized
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

      {/* Approve & Disburse Modal */}
      {approveModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Approve Loan & Disburse Funds
                </h3>
                <p className="text-xs text-slate-500">
                  Applicant: {(approveModalLoan.userId as any)?.name}
                </p>
              </div>
              <button
                onClick={() => setApproveModalLoan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApprove} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
                <p className="font-bold">Banking Disbursement Protocol:</p>
                <p>
                  Approving this loan will automatically credit the approved amount into the customer&apos;s
                  account #{(approveModalLoan.accountId as any)?.accountNumber} and create an official
                  transaction record.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Approved Principal Amount ($)
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Executive Approval Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved in full following compliance review"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModalLoan(null)}
                  className="w-1/3 py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewing}
                  className="w-2/3 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {isReviewing ? (
                    'Disbursing...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Disburse</span>
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
