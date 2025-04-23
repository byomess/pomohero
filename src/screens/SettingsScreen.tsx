import React from 'react';
import { usePomodoro } from '../contexts/PomodoroContext';
import { FiTrash2 } from 'react-icons/fi';
import { PomodoroSettings } from '../types';

export const SettingsScreen: React.FC = () => {
    const {
        settings,
        handleSettingChange, // Use the controlled handler from context
        clearHistory,
        destroyData,
        styles,
    } = usePomodoro();

    const parseIntOrDefault = (value: string, defaultValue: number): number => {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) || parsed < 1 ? defaultValue : parsed;
    };

    return (
        <div className={`w-full max-w-md mx-auto ${styles.textColor} p-4 space-y-6`}>
            <h2 id="settings-title" className="text-2xl font-semibold mb-6 text-center">Configurações</h2>

            <div className="space-y-5">
                {/* Durations */}
                <h3 className="text-lg font-medium opacity-90 border-b border-white/10 pb-2 mb-3">Durações (minutos)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { key: 'workDuration', label: 'Foco' },
                        { key: 'shortBreakDuration', label: 'Pausa Curta' },
                        { key: 'longBreakDuration', label: 'Pausa Longa' },
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <label htmlFor={key} className="block text-sm font-medium mb-1 opacity-80">{label}</label>
                            <input
                                type="number"
                                id={key}
                                min="1"
                                value={Math.round(settings[key as keyof PomodoroSettings] as number / 60)}
                                onChange={(e) => handleSettingChange(key as keyof PomodoroSettings, parseIntOrDefault(e.target.value, 1) * 60)}
                                className={`w-full p-2 rounded-md border-none focus:ring-2 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`}
                            />
                        </div>
                    ))}
                </div>

                {/* Cycles */}
                <h3 className="text-lg font-medium opacity-90 border-b border-white/10 pb-2 mb-3 pt-4">Ciclos</h3>
                <div>
                    <label htmlFor="cyclesBeforeLongBreak" className="block text-sm font-medium mb-1 opacity-80">Ciclos de Foco antes da Pausa Longa</label>
                    <input
                        type="number"
                        id="cyclesBeforeLongBreak"
                        min="1"
                        value={settings.cyclesBeforeLongBreak}
                        onChange={(e) => handleSettingChange('cyclesBeforeLongBreak', parseIntOrDefault(e.target.value, 1))}
                        className={`w-full sm:w-1/3 p-2 rounded-md border-none focus:ring-2 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`}
                    />
                </div>

                {/* Other */}
                <h3 className="text-lg font-medium opacity-90 border-b border-white/10 pb-2 mb-3 pt-4">Outros</h3>
                <div className="flex items-center justify-between">
                    <label htmlFor="soundEnabled" className="text-sm font-medium opacity-80 cursor-pointer">Habilitar Som de Notificação</label>
                    {/* Tailwind needs the explicit color class */}
                    <input
                        type="checkbox"
                        id="soundEnabled"
                        checked={settings.soundEnabled}
                        onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                        className={`w-5 h-5 rounded text-${styles.modalAccentColor.replace('ring-', '')} bg-gray-700 border-gray-600 focus:ring-${styles.modalAccentColor.replace('ring-', '')} focus:ring-2 cursor-pointer`}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="showNavbarLabels" className="text-sm font-medium opacity-80 cursor-pointer">Mostrar Rótulos na Barra de Navegação</label>
                    <input
                        type="checkbox"
                        id="showNavbarLabels"
                        checked={settings.showNavbarLabels}
                        onChange={(e) => handleSettingChange('showNavbarLabels', e.target.checked)}
                        className={`w-5 h-5 rounded text-${styles.modalAccentColor.replace('ring-', '')} bg-gray-700 border-gray-600 focus:ring-${styles.modalAccentColor.replace('ring-', '')} focus:ring-2 cursor-pointer`}
                    />
                </div>

                {/* Data Management */}
                <h3 className="text-lg font-medium opacity-90 border-b border-white/10 pb-2 mb-3 pt-4">Gerenciar Dados</h3>
                <button
                    onClick={clearHistory}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-sm border-2 border-red-700/50 bg-red-600/10 hover:border-red-600/60 text-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors`}
                >
                    <FiTrash2 className="h-4 w-4" /> Limpar Histórico de Foco
                </button>
                <p className="text-xs text-center opacity-60 mt-2">Esta ação é irreversível.</p>

                <button
                    onClick={destroyData}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-sm border-2 border-red-700/50 bg-red-600/10 hover:border-red-600/60 text-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors`}
                >
                    <FiTrash2 className="h-4 w-4" /> Apagar Todos os Dados
                </button>
                <p className="text-xs text-center opacity-60 mt-2">Esta ação é irreversível.</p>
            </div>

        </div>
    );
};
