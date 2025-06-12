import React from 'react';
import ThemedButton from './ThemedButton';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-500/20 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <ThemedButton 
                        onClick={onConfirm} 
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Confirm
                    </ThemedButton>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
