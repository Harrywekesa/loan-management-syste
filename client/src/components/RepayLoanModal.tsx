import React, { useState } from 'react';
import Modal from './Modal';
import api from '../lib/api';

interface RepayLoanModalProps {
    isOpen: boolean;
    onClose: () => void;
    loan: any;
    onRepaymentSuccess: () => void;
}

const RepayLoanModal: React.FC<RepayLoanModalProps> = ({ isOpen, onClose, loan, onRepaymentSuccess }) => {
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRepayFull = () => {
        setAmount(loan.balance.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const repaymentAmount = parseFloat(amount);
            if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
                setError('Please enter a valid amount.');
                setIsSubmitting(false);
                return;
            }
            if (repaymentAmount > loan.balance) {
                setError('Amount cannot be greater than the outstanding balance.');
                setIsSubmitting(false);
                return;
            }

            await api.post(`/loans/${loan.id}/repay`, {
                amount: repaymentAmount,
                phoneNumber: phoneNumber || undefined
            });
            onRepaymentSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred during repayment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Repay Loan: ${loan.product?.name}`}>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                        <button type="button" onClick={handleRepayFull} className="text-xs text-indigo-600 hover:underline">Repay Full Amount</button>
                    </div>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white placeholder-gray-400"
                        placeholder={`Loan Balance: ${loan.balance}`}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">M-Pesa Phone (Optional)</label>
                    <input
                        type="text"
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white placeholder-gray-400"
                        placeholder="2547..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to use registered phone.</p>
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : 'Repay'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RepayLoanModal;
