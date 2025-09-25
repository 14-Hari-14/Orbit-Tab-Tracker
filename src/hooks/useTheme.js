import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('isDarkMode');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('isDarkMode', JSON.stringify(isDark));
    }, [isDark]);

    const toggleTheme = () => setIsDark(prev => !prev);

    return {
        isDark,
        setIsDark,
        toggleTheme
    };
};