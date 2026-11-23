'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import {
  useGetCustomersQuery,
  useUpdateCustomerStatusMutation,
  useGetCustomerByIdQuery,
} from '@/store/api/apiSlice';
import { UserRole } from '@/types';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Loader2,
  X,
  CreditCard,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Check,
  UserCheck,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useGetCustomersQuery({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
  });

  const [updateStatus, { isLoading: isUpdating }] = useUpdateCustomerStatusMutation();

  const { data: details, isLoading: detailsLoading } = useGetCustomerByIdQuery(
    selectedCustomerId || '',
    { skip: !selectedCustomerId }
  );

  const handleRoleChange = async (customerId: string, newRole: UserRole) => {
    try {
      await updateStatus({
        customerId,
        role: newRole,
      }).unwrap();

      toast.success(`User role successfully changed to ${newRole.toUpperCase()}!`);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to update user role');
    }
  };

  const handleApprove = async (customerId: string) => {
    try {
      await updateStatus({
        customerId,
        status: 'active',
      }).unwrap();

      toast.success('Account Approved! Customer can now perform transfers and financial operations.');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to approve account');
    }
  };

  const handleReject = async (customerId: string) => {
    try {
      await updateStatus({
        customerId,
        status: 'inactive',
      }).unwrap();

      toast.error('Account application has been Rejected / Deactivated.');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to reject account');
    }
  };

  const handleToggleBlock = async (customerId: string, currentBlocked: boolean) => {
    try {
      await updateStatus({
        customerId,
        isBlocked: !currentBlocked,
      }).unwrap();

      toast.success(`User account successfully ${!currentBlocked ? 'blocked' : 'unblocked'}!`);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to update user block status');
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer & User Management
          </h1>
          <p className="text-xs text-slate-500">
            Approve or reject customer accounts, modify user roles (Admin / Staff / Customer), and control account standing
          </p>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="staff">Bank Staff</option>
              <option value="admin">Administrators</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Rejected</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role (Changeable)</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Account Standing</th>
                  <th className="py-3 px-4">Approval Actions</th>
                  <th className="py-3 px-4">Security</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading users...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.email}</p>
                      </td>

                      {/* Interactive Role Selector Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={c.role}
                          onChange={(e) => handleRoleChange(c._id, e.target.value as UserRole)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                            c.role === 'admin'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : c.role === 'staff'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Bank Staff</option>
                          <option value="admin">System Admin</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <p>{c.phone || '—'}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{c.address || '—'}</p>
                      </td>

                      {/* Standing Status Badge */}
                      <td className="py-3 px-4">
                        {c.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3" />
                            Pending Approval
                          </span>
                        ) : c.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            Active / Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            <X className="w-3 h-3" />
                            {c.status}
                          </span>
                        )}
                      </td>

                      {/* Approval Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {c.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApprove(c._id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1 transition-colors"
                                title="Approve Customer Account for Full Banking Operations"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleReject(c._id)}
                                className="px-2 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                                title="Reject Account"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : c.status === 'active' ? (
                            <button
                              onClick={() => handleReject(c._id)}
                              className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition-colors"
                              title="Deactivate / Suspend Account"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(c._id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                              title="Re-Approve & Activate Account"
                            >
                              <Check className="w-3 h-3" />
                              <span>Re-Approve</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Blocked Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleBlock(c._id, c.isBlocked)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase transition-colors ${
                            c.isBlocked
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {c.isBlocked ? 'Blocked' : 'Clear'}
                        </button>
                      </td>

                      {/* Action Details */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedCustomerId(c._id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Inspect Profile, Accounts & History"
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

      {/* Customer Full Inspection Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  {details?.customer?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {details?.customer?.name || 'User Profile'}
                  </h3>
                  <p className="text-xs text-slate-500">{details?.customer?.email} • Role: {details?.customer?.role?.toUpperCase()}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {detailsLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading user records...
                </div>
              ) : details ? (
                <>
                  {/* Standing & Quick Role Control in Modal */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Account Standing:</span>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                          details.customer.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : details.customer.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {details.customer.status}
                      </span>
                      {details.customer.isBlocked && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white">
                          BLOCKED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {details.customer.status === 'pending' && (
                        <button
                          onClick={() => {
                            handleApprove(details.customer._id);
                            setSelectedCustomerId(null);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Approve Account
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bank Accounts */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-500" />
                      <span>Associated Bank Accounts ({details.accounts?.length || 0})</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {details.accounts?.map((acc) => (
                        <div
                          key={acc._id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {acc.accountNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                acc.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {acc.status}
                            </span>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500">{acc.accountType} Account</p>
                            <p className="text-base font-extrabold text-slate-900 mt-1">
                              ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                      <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                      <span>Recent Account Transactions ({details.transactions?.length || 0})</span>
                    </h4>

                    {details.transactions?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No transactions recorded yet.</p>
                    ) : (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                            <tr>
                              <th className="py-2 px-3">Txn ID</th>
                              <th className="py-2 px-3">Type</th>
                              <th className="py-2 px-3">Amount</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3 text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {details.transactions?.slice(0, 5).map((t) => (
                              <tr key={t._id}>
                                <td className="py-2 px-3 font-mono text-[11px]">{t.transactionId}</td>
                                <td className="py-2 px-3 uppercase text-[10px] font-bold">{t.type}</td>
                                <td className="py-2 px-3 font-bold text-slate-800">${t.amount.toFixed(2)}</td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-slate-100 text-slate-700">
                                    {t.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right text-slate-400">
                                  {new Date(t.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
