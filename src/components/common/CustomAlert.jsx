import React from 'react';
import ThemedButton from './ThemedButton';
import { useSoundEffect } from '../../hooks/useSoundEffect';

const CustomAlert = ({ message, onClose }) => {
    const { playClick } = useSoundEffect();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Notification</h3>
                <p className="text-gray-700 mb-6">{message}</p>
                <ThemedButton onClick={() => { playClick(); onClose(); }} className="w-full">
                    OK
                </ThemedButton>
            </div>
        </div>
    );
};

export default CustomAlert;