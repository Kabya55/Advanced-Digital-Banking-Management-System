import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  IUser,
  IBankAccount,
  ITransaction,
  ILoan,
  IDepositWithdrawRequest,
  AdminAnalytics,
  CustomerAnalytics,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const bankingApi = createApi({
  reducerPath: 'bankingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('bank_token');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Account', 'Transaction', 'Loan', 'Request', 'Analytics', 'Customer'],
  endpoints: (builder) => ({
    // Auth & Profile
    getMe: builder.query<{ user: IUser; hasPin: boolean }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    login: builder.mutation<
      { user: IUser; token: string; hasPin: boolean },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Account', 'Transaction', 'Loan', 'Analytics'],
    }),
    register: builder.mutation<
      { user: IUser; token: string; message: string },
      { name: string; email: string; password: string; phone?: string; address?: string }
    >({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    setTransactionPin: builder.mutation<
      { success: boolean; message: string },
      { pin: string; currentPin?: string }
    >({
      query: (body) => ({
        url: '/auth/pin',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // Bank Accounts
    getAccounts: builder.query<IBankAccount[], { userId?: string } | void>({
      query: (params) => {
        const queryStr = params?.userId ? `?userId=${params.userId}` : '';
        return `/accounts${queryStr}`;
      },
      providesTags: ['Account'],
    }),
    getAccountById: builder.query<IBankAccount, string>({
      query: (id) => `/accounts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Account', id }],
    }),
    createAccount: builder.mutation<
      IBankAccount,
      { userId?: string; accountType: string; initialDeposit?: number; currency?: string }
    >({
      query: (body) => ({
        url: '/accounts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Account', 'Analytics', 'Customer'],
    }),
    updateAccountStatus: builder.mutation<
      IBankAccount,
      { accountId: string; status: 'active' | 'frozen' | 'closed' }
    >({
      query: ({ accountId, status }) => ({
        url: `/accounts/${accountId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Account', 'Analytics'],
    }),
    updateAccountLimits: builder.mutation<
      IBankAccount,
      { accountId: string; dailyLimit: number; perTxnLimit: number }
    >({
      query: ({ accountId, ...body }) => ({
        url: `/accounts/${accountId}/limits`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Account'],
    }),

    // Transactions
    getTransactions: builder.query<
      { transactions: ITransaction[]; total: number; page: number; totalPages: number },
      {
        accountId?: string;
        type?: string;
        status?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
        flagged?: boolean;
      }
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params.accountId) query.set('accountId', params.accountId);
        if (params.type && params.type !== 'all') query.set('type', params.type);
        if (params.status && params.status !== 'all') query.set('status', params.status);
        if (params.search) query.set('search', params.search);
        if (params.startDate) query.set('startDate', params.startDate);
        if (params.endDate) query.set('endDate', params.endDate);
        if (params.page) query.set('page', params.page.toString());
        if (params.limit) query.set('limit', params.limit.toString());
        if (params.flagged !== undefined) query.set('flagged', String(params.flagged));
        return `/transactions?${query.toString()}`;
      },
      providesTags: ['Transaction'],
    }),
    getTransactionById: builder.query<ITransaction, string>({
      query: (id) => `/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Transaction', id }],
    }),
    transferFund: builder.mutation<
      { transaction: ITransaction; newBalance: number; message: string },
      {
        senderAccountId: string;
        receiverAccountNumber: string;
        amount: number;
        description: string;
        pin: string;
      }
    >({
      query: (body) => ({
        url: '/transactions/transfer',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Account', 'Transaction', 'Analytics'],
    }),
    flagTransaction: builder.mutation<
      ITransaction,
      { transactionId: string; flagReason: string }
    >({
      query: ({ transactionId, flagReason }) => ({
        url: `/transactions/${transactionId}/flag`,
        method: 'PATCH',
        body: { flagReason },
      }),
      invalidatesTags: ['Transaction'],
    }),

    // Requests (Deposit & Withdrawal Requests)
    getRequests: builder.query<
      IDepositWithdrawRequest[],
      { status?: string; type?: string } | void
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.status && params.status !== 'all') query.set('status', params.status);
        if (params?.type && params.type !== 'all') query.set('type', params.type);
        return `/requests?${query.toString()}`;
      },
      providesTags: ['Request'],
    }),
    createDepositWithdrawRequest: builder.mutation<
      IDepositWithdrawRequest,
      { accountId: string; type: 'deposit' | 'withdrawal'; amount: number; description: string }
    >({
      query: (body) => ({
        url: '/requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Request'],
    }),
    reviewRequest: builder.mutation<
      IDepositWithdrawRequest,
      { requestId: string; action: 'approved' | 'rejected'; reviewNotes?: string }
    >({
      query: ({ requestId, ...body }) => ({
        url: `/requests/${requestId}/review`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Request', 'Account', 'Transaction', 'Analytics'],
    }),

    // Loans
    getLoans: builder.query<ILoan[], { userId?: string; status?: string } | void>({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.userId) query.set('userId', params.userId);
        if (params?.status && params.status !== 'all') query.set('status', params.status);
        return `/loans?${query.toString()}`;
      },
      providesTags: ['Loan'],
    }),
    getLoanById: builder.query<ILoan, string>({
      query: (id) => `/loans/${id}`,
      providesTags: (result, error, id) => [{ type: 'Loan', id }],
    }),
    applyLoan: builder.mutation<
      ILoan,
      {
        accountId: string;
        loanType: string;
        amount: number;
        durationMonths: number;
        monthlyIncome: number;
        employmentStatus: string;
        description: string;
      }
    >({
      query: (body) => ({
        url: '/loans',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Loan', 'Analytics'],
    }),
    reviewLoan: builder.mutation<
      ILoan,
      {
        loanId: string;
        action: 'approved' | 'rejected' | 'under_review';
        approvedAmount?: number;
        staffNotes?: string;
      }
    >({
      query: ({ loanId, ...body }) => ({
        url: `/loans/${loanId}/review`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Loan', 'Account', 'Transaction', 'Analytics'],
    }),
    repayLoanInstallment: builder.mutation<
      { loan: ILoan; transaction: ITransaction; message: string },
      { loanId: string; installmentNumber: number; accountId: string; pin: string }
    >({
      query: (body) => ({
        url: '/loans/repay',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Loan', 'Account', 'Transaction', 'Analytics'],
    }),

    // Analytics
    getAdminAnalytics: builder.query<AdminAnalytics, void>({
      query: () => '/analytics/admin',
      providesTags: ['Analytics'],
    }),
    getCustomerAnalytics: builder.query<CustomerAnalytics, { accountId?: string } | void>({
      query: (params) => {
        const queryStr = params?.accountId ? `?accountId=${params.accountId}` : '';
        return `/analytics/customer${queryStr}`;
      },
      providesTags: ['Analytics'],
    }),

    // Customers (Admin & Staff)
    getCustomers: builder.query<IUser[], { search?: string; status?: string } | void>({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.search) query.set('search', params.search);
        if (params?.status && params.status !== 'all') query.set('status', params.status);
        return `/customers?${query.toString()}`;
      },
      providesTags: ['Customer'],
    }),
    getCustomerById: builder.query<
      { customer: IUser; accounts: IBankAccount[]; loans: ILoan[]; transactions: ITransaction[] },
      string
    >({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    updateCustomerStatus: builder.mutation<
      IUser,
      { customerId: string; status?: string; isBlocked?: boolean }
    >({
      query: ({ customerId, ...body }) => ({
        url: `/customers/${customerId}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Customer', 'Analytics'],
    }),
    registerCustomerByStaff: builder.mutation<
      { customer: IUser; account: IBankAccount; tempPassword?: string },
      {
        name: string;
        email: string;
        phone: string;
        address: string;
        accountType: string;
        initialDeposit: number;
      }
    >({
      query: (body) => ({
        url: '/customers/staff-register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer', 'Account', 'Analytics'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useSetTransactionPinMutation,
  useGetAccountsQuery,
  useGetAccountByIdQuery,
  useCreateAccountMutation,
  useUpdateAccountStatusMutation,
  useUpdateAccountLimitsMutation,
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useTransferFundMutation,
  useFlagTransactionMutation,
  useGetRequestsQuery,
  useCreateDepositWithdrawRequestMutation,
  useReviewRequestMutation,
  useGetLoansQuery,
  useGetLoanByIdQuery,
  useApplyLoanMutation,
  useReviewLoanMutation,
  useRepayLoanInstallmentMutation,
  useGetAdminAnalyticsQuery,
  useGetCustomerAnalyticsQuery,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useUpdateCustomerStatusMutation,
  useRegisterCustomerByStaffMutation,
} = bankingApi;
