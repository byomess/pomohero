import React from 'react';
import Modal from 'react-modal';
import { MusicPlayer } from './MusicPlayer';
import { FaTimes } from 'react-icons/fa';

interface MusicPlayerModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
}

export const MusicPlayerModal: React.FC<MusicPlayerModalProps> = ({
    isOpen,
    onRequestClose,
}) => {
    const overlayBaseClasses = `
        fixed inset-0 z-40 flex items-center justify-center
        bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-in-out
    `;
    const overlayVisibilityClasses = isOpen
        ? 'opacity-100 visible'
        : 'opacity-0 invisible pointer-events-none';

        const contentBaseClasses = `
        font-sans
        relative w-[92vw] max-w-md max-h-[90vh]
        bg-gradient-to-br from-gray-900/80 to-slate-900/80
        border border-white/10 rounded-3xl shadow-2xl
        overflow-hidden flex flex-col
        transition-all duration-300 ease-in-out
        outline-none
    `;
    
    const contentVisibilityClasses = isOpen
        ? 'opacity-100 visible scale-100'
        : 'opacity-0 invisible scale-95 pointer-events-none';

    return (
        <Modal
            isOpen={true}
            onRequestClose={onRequestClose}
            contentLabel="Player de Música"
            closeTimeoutMS={300}
            ariaHideApp={false}
            overlayClassName={`${overlayBaseClasses} ${overlayVisibilityClasses}`}
            className={`${contentBaseClasses} ${contentVisibilityClasses}`}
        >
            {/* Topo */}
            <div className={`relative flex items-center justify-end px-5 py-3`}>
                {/* <h2 className="text-base font-semibold tracking-wide">Música & Sons</h2> */}
                <button
                    onClick={onRequestClose}
                    className="absolute top-4 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
                    aria-label="Fechar player de música"
                >
                    <FaTimes size={18} />
                </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-2 sm:p-3">
                <MusicPlayer />
            </div>
        </Modal>
    );
};
