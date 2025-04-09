export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('pt-BR', {
        timeStyle: 'short',
        hour12: false,
    });
};
