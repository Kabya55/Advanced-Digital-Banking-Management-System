import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ILoan, LoanStatus } from '@/types';

interface LoanState {
  loans: ILoan[];
  selectedLoan: ILoan | null;
  statusFilter: LoanStatus | 'all';
  isLoading: boolean;
  error: string | null;
}

const initialState: LoanState = {
  loans: [],
  selectedLoan: null,
  statusFilter: 'all',
  isLoading: false,
  error: null,
};

export const loanSlice = createSlice({
  name: 'loan',
  initialState,
  reducers: {
    setLoans: (state, action: PayloadAction<ILoan[]>) => {
      state.loans = action.payload;
    },
    setSelectedLoan: (state, action: PayloadAction<ILoan | null>) => {
      state.selectedLoan = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<LoanStatus | 'all'>) => {
      state.statusFilter = action.payload;
    },
    setLoanLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLoanError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setLoans,
  setSelectedLoan,
  setStatusFilter,
  setLoanLoading,
  setLoanError,
} = loanSlice.actions;

export default loanSlice.reducer;
