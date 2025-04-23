import React, { useState, useRef, useEffect } from 'react';
import { FaMusic } from 'react-icons/fa';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { PLAYER_FLOATING_BUTTON_POSITION_STORAGE_KEY } from '../../utils/constants';

interface FloatingMusicButtonProps {
  onClick: () => void;
}

export const FloatingMusicButton: React.FC<FloatingMusicButtonProps> = ({ onClick }) => {
  const [position, setPosition] = useLocalStorage(PLAYER_FLOATING_BUTTON_POSITION_STORAGE_KEY, { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const savedX = localStorage.getItem('musicButtonX');
    const savedY = localStorage.getItem('musicButtonY');
    if (savedX && savedY) {
      setPosition({ x: parseInt(savedX), y: parseInt(savedY) });
    }
  }, []);

  const updatePosition = (x: number, y: number) => {
    setPosition({ x, y });
    localStorage.setItem('musicButtonX', String(x));
    localStorage.setItem('musicButtonY', String(y));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    offsetRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updatePosition(e.clientX - offsetRef.current.x, e.clientY - offsetRef.current.y);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    updatePosition(touch.clientX - offsetRef.current.x, touch.clientY - offsetRef.current.y);
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transition: isDragging ? 'none' : 'all 0.2s ease-out',
        zIndex: 50,
      }}
      className={`
        w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center
        text-white
        bg-black/20 backdrop-blur-xs
        hover:scale-110 focus:outline-none
        focus:ring-2 focus:ring-offset-2
        hover:ring-white/30 focus:ring-white/50
        cursor-${isDragging ? 'grabbing' : 'grab'}
      `}
      aria-label="Abrir player de música"
    >
      <FaMusic size={24} />
    </button>
  );
};
