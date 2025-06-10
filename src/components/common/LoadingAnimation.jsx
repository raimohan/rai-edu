import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const LoadingAnimation = () => {
    const { theme } = useContext(ThemeContext);
    return (
        <div className="flex items-center justify-center">
            <style>{`
                @keyframes pageTurnSmall {
                  0% { transform: rotateY(0deg); }
                  50% { transform: rotateY(-90deg); }
                  100% { transform: rotateY(-180deg); }
                }
                .page-turn-small {
                  animation: pageTurnSmall 1.5s infinite linear;
                  transform-origin: left center;
                }
            `}</style>
            <div className="relative w-12 h-12 flex items-center justify-center">
                <div className={`absolute w-10 h-12 bg-${theme?.primary || 'blue-500'} rounded-md shadow-md`}></div>
                <div className="absolute w-10 h-12 bg-white rounded-md shadow-sm page-turn-small" style={{ animationDelay: '0s', zIndex: 3 }}></div>
                <div className="absolute w-10 h-12 bg-gray-100 rounded-md shadow-sm page-turn-small" style={{ animationDelay: '0.3s', zIndex: 2 }}></div>
                <div className="absolute w-10 h-12 bg-gray-200 rounded-md shadow-sm page-turn-small" style={{ animationDelay: '0.6s', zIndex: 1 }}></div>
            </div>
        </div>
    );
};

export default LoadingAnimation;