import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useSoundEffect } from '../../hooks/useSoundEffect';

const ThemedButton = ({ children, onClick, className = '', icon: Icon = null, type = 'button', disabled = false }) => {
    const { theme } = useContext(ThemeContext);
    const { playClick } = useSoundEffect();

    return (
        <button
            type={type}
            onClick={(e) => {
                if (onClick) {
                    playClick();
                    onClick(e);
                }
            }}
            disabled={disabled}
            className={`flex items-center justify-center bg-${theme?.primary || 'blue-500'} text-white py-3 px-6 rounded-lg hover:bg-${(theme?.primary || 'blue-500').replace('-500', '-600')} transition-all duration-200 font-medium shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-${(theme?.primary || 'blue-500').replace('-500', '-400')} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {Icon && <Icon className="inline w-4 h-4 mr-2" />} {children}
        </button>
    );
};

export default ThemedButton;