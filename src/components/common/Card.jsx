import React from 'react';
import { useSoundEffect } from '../../hooks/useSoundEffect';

const Card = ({ title, children, className = '', onClick = null }) => {
    const { playClick } = useSoundEffect();
    return (
        <div
            className={`bg-white p-6 rounded-2xl shadow-md transition-all duration-300 ${className} ${onClick ? 'cursor-pointer hover:shadow-lg transform hover:-translate-y-1' : ''}`}
            onClick={(e) => {
                if (onClick) {
                    playClick();
                    onClick(e);
                }
            }}
        >
            {title && <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>}
            {children}
        </div>
    );
};

export default Card;
