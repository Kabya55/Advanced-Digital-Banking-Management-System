'use client';

import React from 'react';
import { ITransaction } from '@/types';
import { X, Download, Printer, CheckCircle2, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface TransactionReceiptModalProps {
  transaction: ITransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionReceiptModal({
  transaction,
  isOpen,
  onClose,
}: TransactionReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Apex Bank', 14, 22);
      doc.setFontSize(10);
      doc.text('OFFICIAL TRANSACTION RECEIPT', 14, 30);

      // Status & Ref
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.text(`Transaction Reference: ${transaction.transactionId}`, 14, 52);
      doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 60);

      // Receipt details table
      autoTable(doc, {
        startY: 68,
        head: [['Field', 'Details']],
        body: [
          ['Transaction ID', transaction.transactionId],
          ['Transaction Type', transaction.type.toUpperCase().replace('_', ' ')],
          ['Amount', `$${transaction.amount.toFixed(2)} USD`],
          ['Transaction Fee', `$${transaction.fee.toFixed(2)} USD`],
          ['Status', transaction.status.toUpperCase()],
          ['Sender Account', transaction.senderAccountNum || 'N/A (Cash / External)'],
          ['Recipient Account', transaction.receiverAccountNum || 'N/A (Cash / External)'],
          ['Date & Time', new Date(transaction.createdAt).toLocaleString()],
          ['Description / Note', transaction.description || 'No note provided'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // indigo-600
        styles: { fontSize: 10, cellPadding: 4 },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'Apex Bank Digital Banking System — This is a system-generated electronic receipt.',
        14,
        pageHeight - 15
      );

      doc.save(`Receipt-${transaction.transactionId}.pdf`);
      toast.success('Transaction receipt PDF downloaded!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-bold tracking-tight">Transaction Successful</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">{transaction.transactionId}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center py-2">
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Amount</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-0.5">
              ${transaction.amount.toFixed(2)}
            </p>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
              Completed
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Transaction Type</span>
              <span className="font-semibold text-slate-800 capitalize">
                {transaction.type.replace('_', ' ')}
              </span>
            </div>

            {transaction.senderAccountNum && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Sender Account</span>
                <span className="font-mono font-medium text-slate-800">
                  {transaction.senderAccountNum}
                </span>
              </div>
            )}

            {transaction.receiverAccountNum && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Receiver Account</span>
                <span className="font-mono font-medium text-indigo-600">
                  {transaction.receiverAccountNum}
                </span>
              </div>
            )}

            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Date & Time</span>
              <span className="text-slate-700">
                {new Date(transaction.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Fee</span>
              <span className="font-semibold text-emerald-600">$0.00</span>
            </div>

            {transaction.description && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Description</span>
                <span className="text-slate-800 font-medium">{transaction.description}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              onClick={downloadPDF}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
