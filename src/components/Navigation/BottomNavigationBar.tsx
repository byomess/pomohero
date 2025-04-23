import React, { useState, useEffect, useRef } from 'react';
// Assuming ScreenName is imported correctly from '../Layout/MainLayout'
// If not, define it or import it properly, e.g.:
// type ScreenName = 'timer' | 'backlog' | 'history' | 'settings';
import { ScreenName } from '../Layout/MainLayout'; // Make sure this path is correct
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FaListAlt, FaPlayCircle, FaHistory } from 'react-icons/fa';
import { FaGear } from 'react-icons/fa6';

interface BottomNavigationBarProps {
    activeScreen: ScreenName;
    setActiveScreen: (screen: ScreenName) => void;
}

interface IndicatorStyle {
    left: number;
    width: number;
    opacity: number; // Use opacity to fade in on initial load
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
    activeScreen,
    setActiveScreen
}) => {
    const { styles, settings } = usePomodoro();
    const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({ left: 0, width: 0, opacity: 0 });
    const navRef = useRef<HTMLElement>(null);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const navItems: { name: ScreenName; icon: React.ElementType; label: string }[] = [
        { name: 'timer', icon: FaPlayCircle, label: 'Timer' },
        { name: 'backlog', icon: FaListAlt, label: 'Backlog' },
        { name: 'history', icon: FaHistory, label: 'History' },
        // { name: 'player', icon: FaMusic, label: 'Player' },
        { name: 'settings', icon: FaGear, label: 'Settings' }
    ];

    // Calculate indicator position based on the active button
    useEffect(() => {
        const activeIndex = navItems.findIndex(item => item.name === activeScreen);
        const activeButton = buttonRefs.current[activeIndex];

        if (activeButton && navRef.current) {
            const navRect = navRef.current.getBoundingClientRect();
            const buttonRect = activeButton.getBoundingClientRect();

            // Calculate position relative to the nav container
            const newLeft = buttonRect.left - navRect.left;
            const newWidth = buttonRect.width;

            setIndicatorStyle({
                left: newLeft,
                width: newWidth,
                opacity: 1 // Make visible once calculated
            });
        } else {
            // Optionally hide if button ref isn't available yet
            setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
        }
        // Adding navItems.length to dependencies in case the number of items changes,
        // though it's static in this example.
    }, [activeScreen, navItems.length]);

    const activeTextColorClass = styles.textPrimaryColor || 'text-white';
    const indicatorColorClass = styles.borderPrimaryColor || 'border-white';

    return (
        // Add relative positioning for the absolute indicator and overflow-hidden
        <nav
            ref={navRef}
            className="relative w-full bg-black/40 backdrop-blur-md flex justify-around items-center border-t border-white/10 shadow-lg rounded-t-3xl overflow-hidden"
        >
            {navItems.map(({ name, icon: Icon, label }, index) => {
                const isActive = activeScreen === name;
                return (
                    <button
                        key={name}
                        ref={(el) => {
                            buttonRefs.current[index] = el;
                        }}
                        onClick={() => setActiveScreen(name)}
                        // z-10 ensures buttons are clickable above the indicator
                        className={`relative z-10 flex flex-col items-center justify-center px-4 py-4 transition-colors duration-200 ease-in-out ${isActive ? activeTextColorClass : 'text-gray-500 hover:text-white'
                            }`}
                        aria-label={`Ir para ${label}`}
                        aria-current={isActive ? 'page' : undefined} // Accessibility improvement
                    >
                        {/* Icon Container - removed background and border styling */}
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Icon size={22} />
                        </div>
                        {settings.showNavbarLabels && (
                            <span className={`text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                {label}
                            </span>
                        )}
                    </button>
                );
            })}

            {/* Animated Indicator Line */}
            <div
                className={`absolute bottom-0 border-2 ${indicatorColorClass} transition-all duration-300 ease-in-out`}
                style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                    opacity: indicatorStyle.opacity,
                }}
                aria-hidden="true" // Hide from screen readers
            />
        </nav>
    );
};