import React, { useState, useEffect } from 'react';

// Panel Open Effects with Slide-In Animation and Backdrop Blur

export const PanelOpenEffect: React.FC<{
  isOpen: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  direction?: 'left' | 'right' | 'top' | 'bottom' | 'center';
  duration?: number;
}> = ({ isOpen, children, onClose, direction = 'right', duration = 300 }) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  if (!isVisible) return null;

  const getTransformOrigin = () => {
    switch (direction) {
      case 'left':
        return 'translateX(-100%)';
      case 'right':
        return 'translateX(100%)';
      case 'top':
        return 'translateY(-100%)';
      case 'bottom':
        return 'translateY(100%)';
      case 'center':
        return 'scale(0.8)';
      default:
        return 'translateX(100%)';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0)',
          backdropFilter: `blur(${isAnimating ? 8 : 0}px)`,
          WebkitBackdropFilter: `blur(${isAnimating ? 8 : 0}px)`,
          transition: `backdrop-filter ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          zIndex: 999,
          opacity: isAnimating ? 1 : 0,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          inset: '50%',
          transform: `translate(-50%, -50%) ${isAnimating ? 'scale(1) translateZ(0)' : getTransformOrigin() + ' scale(0.95)'}`,
          transition: `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
          zIndex: 1000,
          opacity: isAnimating ? 1 : 0,
          pointerEvents: isAnimating ? 'auto' : 'none',
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInFromTop {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

// Modal Panel Container
export const ModalPanel: React.FC<{
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
}> = ({ children, title, onClose }) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '16px',
        boxShadow: `
          0 0 40px rgba(255, 215, 0, 0.2),
          0 20px 60px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
        border: '1px solid rgba(255, 215, 0, 0.2)',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        color: '#fff',
      }}
    >
      {title && (
        <div
          style={{
            padding: '24px 24px 16px',
            borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffd700',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'rotate(90deg) scale(1.2)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'rotate(0) scale(1)';
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  );
};

// Slide-In Panel from Right
export const SidePanel: React.FC<{
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  width?: string;
}> = ({ isOpen, onClose, children, width = '400px' }) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 999,
          animation: isOpen ? 'fadeIn 0.3s ease' : 'fadeOut 0.3s ease',
        }}
      />

      {/* Side Panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          overflow: 'auto',
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};
