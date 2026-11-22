import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IBankAccount } from '@/types';

interface AccountState {
  accounts: IBankAccount[];
  selectedAccount: IBankAccount | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AccountState = {
  accounts: [],
  selectedAccount: null,
  isLoading: false,
  error: null,
};

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccounts: (state, action: PayloadAction<IBankAccount[]>) => {
      state.accounts = action.payload;
      if (!state.selectedAccount && action.payload.length > 0) {
        state.selectedAccount = action.payload[0];
      } else if (state.selectedAccount) {
        const updated = action.payload.find((a) => a._id === state.selectedAccount?._id);
        if (updated) state.selectedAccount = updated;
      }
    },
    setSelectedAccount: (state, action: PayloadAction<IBankAccount | string>) => {
      if (typeof action.payload === 'string') {
        state.selectedAccount =
          state.accounts.find((a) => a._id === action.payload) || null;
      } else {
        state.selectedAccount = action.payload;
      }
    },
    updateAccountBalance: (
      state,
      action: PayloadAction<{ accountId: string; newBalance: number }>
    ) => {
      const acc = state.accounts.find((a) => a._id === action.payload.accountId);
      if (acc) {
        acc.balance = action.payload.newBalance;
      }
      if (state.selectedAccount && state.selectedAccount._id === action.payload.accountId) {
        state.selectedAccount.balance = action.payload.newBalance;
      }
    },
    setAccountLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAccountError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setAccounts,
  setSelectedAccount,
  updateAccountBalance,
  setAccountLoading,
  setAccountError,
} = accountSlice.actions;
export default accountSlice.reducer;
