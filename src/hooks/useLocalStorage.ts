import { useState, useEffect } from 'react';

// Improved loadFromLocalStorage within the hook
function loadStoredValue<T>(key: string, defaultValue: T): T {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            const parsedValue = JSON.parse(storedValue);
            // Basic type check and structure check for objects
             if (typeof parsedValue === typeof defaultValue && parsedValue !== null) {
                 if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
                    // Ensure all default keys exist in the parsed value before merging
                    const defaultKeys = Object.keys(defaultValue);
                    const parsedKeys = Object.keys(parsedValue);
                    if (defaultKeys.every(k => parsedKeys.includes(k))) {
                         return { ...defaultValue, ...parsedValue }; // Merge, parsed takes precedence
                    }
                 } else {
                    return parsedValue; // Handles primitives, arrays, etc.
                 }
             }
        }
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        localStorage.removeItem(key); // Clear corrupted data
    }
    return defaultValue;
}


export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => loadStoredValue(key, defaultValue));

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }, [key, value]);

    return [value, setValue];
}
