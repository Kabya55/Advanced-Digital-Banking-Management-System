'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import StaffCustomerModal from '@/components/staff/StaffCustomerModal';
import {
  useGetCustomersQuery,
  useUpdateCustomerStatusMutation,
  useGetCustomerByIdQuery,
} from '@/store/api/apiSlice';
import { IUser, UserRole } from '@/types';
import {
  Users,
  Search,
  UserPlus,
  Eye,
  CreditCard,
  ArrowLeftRight,
  Loader2,
  X,
  Check,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

export default function StaffCustomersPage() {
  const [modalOpen, setModalOpen] = useState(false);
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
    <DashboardLayout allowedRoles={['staff']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer & User Directory</h1>
            <p className="text-xs text-slate-500">
              Verify customer identities, approve registrations, and onboard depositors
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Customer</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, email, or phone..."
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
                  <th className="py-3 px-4">Role</th>
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
                      Loading customer directory...
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

                      {/* Read-Only Role Badge (Role can only be changed by Admin) */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg border uppercase tracking-wider ${
                            c.role === 'admin'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : c.role === 'staff'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {c.role === 'admin' ? 'Administrator' : c.role === 'staff' ? 'Staff' : 'Customer'}
                        </span>
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

      {/* Customer Details Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Customer Profile & Accounts: {details?.customer?.name}
                </h3>
                <p className="text-xs text-slate-500">{details?.customer?.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {detailsLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading accounts...
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Bank Accounts ({details?.accounts?.length || 0})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {details?.accounts?.map((acc) => (
                        <div key={acc._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-xs text-slate-800">
                              {acc.accountType}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              acc.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : acc.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {acc.status}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-indigo-600 font-medium">
                            {acc.accountNumber}
                          </p>
                          <p className="text-lg font-bold text-slate-900 mt-2">
                            ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Recent Activity
                    </h4>
                    <div className="space-y-2 text-xs">
                      {details?.transactions?.slice(0, 5).map((t) => (
                        <div
                          key={t._id}
                          className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 capitalize">
                              {t.type.replace('_', ' ')}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {new Date(t.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">${t.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <StaffCustomerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </DashboardLayout>
  );
}
