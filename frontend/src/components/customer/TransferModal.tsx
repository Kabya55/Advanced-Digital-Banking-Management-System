'use client';

import React, { useState } from 'react';
import { IBankAccount, ITransaction } from '@/types';
import { useTransferFundMutation } from '@/store/api/apiSlice';
import { X, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: IBankAccount[];
  onSuccess: (txn: ITransaction) => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  accounts,
  onSuccess,
}: TransferModalProps) {
  const [senderAccountId, setSenderAccountId] = useState(accounts[0]?._id || '');
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const [transferFund, { isLoading }] = useTransferFundMutation();

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a._id === senderAccountId) || accounts[0];
  const numAmount = Number(amount);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) {
      toast.error('Please select a sender account');
      return;
    }

    if (selectedAccount.status === 'pending') {
      toast.error('Your account is pending admin approval. Financial transactions are locked.');
      return;
    }

    if (selectedAccount.status !== 'active') {
      toast.error(`This account is ${selectedAccount.status}. Transfers are not permitted.`);
      return;
    }

    if (!receiverAccountNumber.trim()) {
      toast.error('Please enter recipient account number');
      return;
    }

    if (receiverAccountNumber.trim() === selectedAccount.accountNumber) {
      toast.error('Cannot transfer to the same account');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid transfer amount greater than $0');
      return;
    }

    if (numAmount > selectedAccount.balance) {
      toast.error(`Insufficient balance. Available: $${selectedAccount.balance.toFixed(2)}`);
      return;
    }

    if (numAmount > selectedAccount.perTransactionLimit) {
      toast.error(`Amount exceeds per-transaction limit of $${selectedAccount.perTransactionLimit.toLocaleString()}`);
      return;
    }

    setStep(2);
  };

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin || pin.length < 4) {
      toast.error('Please enter your 4-digit Transaction PIN');
      return;
    }

    try {
      const res = await transferFund({
        senderAccountId: selectedAccount._id,
        receiverAccountNumber: receiverAccountNumber.trim(),
        amount: numAmount,
        description: description.trim(),
        pin: pin.trim(),
      }).unwrap();

      toast.success('Fund transfer completed successfully!');
      onSuccess(res.transaction);
      onClose();
      // Reset form
      setReceiverAccountNumber('');
      setAmount('');
      setDescription('');
      setPin('');
      setStep(1);
    } catch (err: any) {
      toast.error(err?.data?.error || err.message || 'Transfer failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {step === 1 ? 'Instant Fund Transfer' : 'Authorize Banking Transfer'}
            </h3>
            <p className="text-xs text-slate-500">
              {step === 1 ? 'Transfer funds instantly within Apex Bank' : 'Verify details & enter Transaction PIN'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="p-6 space-y-4">
            {/* From Account */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                From Account
              </label>
              <select
                value={senderAccountId}
                onChange={(e) => setSenderAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountType} ({acc.accountNumber}) - ${acc.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Account Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Recipient Account Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1099887766"
                value={receiverAccountNumber}
                onChange={(e) => setReceiverAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Demo target: Try Sarah Jenkins: <span className="font-mono font-medium text-indigo-600">1099887766</span>
              </p>
            </div>

            {/* Transfer Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Transfer Amount ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {selectedAccount && (
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                  <span>Available: ${selectedAccount.balance.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => setAmount(String(selectedAccount.balance))}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    Max
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reference / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Monthly rent, Consulting fee"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              {selectedAccount?.status === 'pending' && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">Account Pending Approval</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Your registration is awaiting approval by bank staff. Outgoing fund transfers are locked.
                    </p>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={selectedAccount?.status !== 'active'}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                  selectedAccount?.status !== 'active'
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                }`}
              >
                <span>
                  {selectedAccount?.status === 'pending'
                    ? 'Account Pending Approval (Locked)'
                    : 'Continue to Authorization'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmTransfer} className="p-6 space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">From Account:</span>
                <span className="font-semibold text-slate-800">
                  {selectedAccount.accountType} ({selectedAccount.accountNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">To Account:</span>
                <span className="font-mono font-semibold text-indigo-700">{receiverAccountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transfer Amount:</span>
                <span className="text-sm font-bold text-slate-900">${numAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Fee:</span>
                <span className="font-semibold text-emerald-600">$0.00 (Free)</span>
              </div>
            </div>

            {/* Transaction PIN Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Enter 4-Digit Transaction PIN
              </label>
              <input
                type="password"
                maxLength={6}
                required
                autoFocus
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center tracking-widest text-xl px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-center text-slate-400 mt-1">
                Demo Default PIN is: <span className="font-bold text-slate-700">1234</span>
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Transfer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
