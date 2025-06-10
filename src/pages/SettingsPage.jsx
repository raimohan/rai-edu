import React, { useContext } from 'react';
import Card from '../components/common/Card';
import { ThemeContext, themeColors } from '../contexts/ThemeContext';
import { useSoundEffect } from '../hooks/useSoundEffect';

const SettingsPage = () => {
    const { currentTheme, setCurrentTheme } = useContext(ThemeContext);
    const { playClick } = useSoundEffect();

    const handleThemeChange = (color) => {
        playClick();
        setCurrentTheme(color);
    };

    return (
        <Card title="Settings">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Theme Color</h4>
            <div className="flex flex-wrap gap-4">
                {Object.keys(themeColors).map(color => (
                    <button
                        key={color}
                        onClick={() => handleThemeChange(color)}
                        className={`w-10 h-10 rounded-full bg-${color === 'black' ? 'gray-800' : themeColors[color].primary} focus:outline-none transition-transform hover:scale-110 ${currentTheme === color ? 'ring-4 ring-offset-2 ring-' + themeColors[color].primary.replace('-500', '-400') : ''}`}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                ))}
            </div>
        </Card>
    );
};

export default SettingsPage;