import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ITransaction, TransactionType, TransactionStatus } from '@/types';

interface TransactionFilterState {
  type: TransactionType | 'all';
  status: TransactionStatus | 'all';
  search: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

interface TransactionState {
  transactions: ITransaction[];
  selectedTransaction: ITransaction | null;
  filters: TransactionFilterState;
  isLoading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transactions: [],
  selectedTransaction: null,
  filters: {
    type: 'all',
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  },
  isLoading: false,
  error: null,
};

export const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<ITransaction[]>) => {
      state.transactions = action.payload;
    },
    setSelectedTransaction: (state, action: PayloadAction<ITransaction | null>) => {
      state.selectedTransaction = action.payload;
    },
    setFilter: (
      state,
      action: PayloadAction<Partial<TransactionFilterState>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setTransactionLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTransactionError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setTransactions,
  setSelectedTransaction,
  setFilter,
  resetFilters,
  setTransactionLoading,
  setTransactionError,
} = transactionSlice.actions;

export default transactionSlice.reducer;
