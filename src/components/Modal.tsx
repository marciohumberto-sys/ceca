import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, subtitle, children, footer, maxWidth = 'max-w-lg' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 220); // matching exit animation duration
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay with sutil blur and soft dark tint */}
      <div 
        className={`absolute inset-0 bg-graphite-900/45 ${
          isClosing ? 'animate-modal-overlay-out' : 'animate-modal-overlay-in'
        }`} 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        ref={modalRef}
        className={`relative w-full ${maxWidth} bg-bg-card rounded-2xl shadow-[0_16px_40px_-10px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.15)] border border-graphite-100 flex flex-col max-h-[90vh] overflow-hidden ${
          isClosing ? 'animate-modal-card-out' : 'animate-modal-card-in'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-graphite-100/60">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-graphite-900 tracking-tight leading-tight">{title}</h2>
            {subtitle && (
              <p className="text-[11.5px] text-graphite-400/90 font-normal mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-graphite-400 hover:text-graphite-700 hover:bg-graphite-100/50 transition-all duration-150"
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-graphite-100 bg-graphite-50/20 flex justify-end items-center gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
