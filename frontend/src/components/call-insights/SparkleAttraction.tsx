import React, { ReactNode } from 'react';

const SparklesIcon = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    <path d="M20 3v4M22 5h-4M4 17v2M5 18H3"/>
  </svg>
);

interface SparkleAttractionProps {
  children: ReactNode;
  isActive: boolean;
  variant?: 'tab' | 'button';
}

export { SparklesIcon };

export default function SparkleAttraction({
  children,
  isActive,
  variant = 'button'
}: SparkleAttractionProps) {
  if (!isActive) return <>{children}</>;

  return (
    <>
      <style>{`
        @keyframes sparkleGlow {
          0%, 100% {
            box-shadow: 0 0 20px hsla(174,56%,55%,0.4), 0 0 40px hsla(97,72%,48%,0.2);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px hsla(174,56%,55%,0.6), 0 0 60px hsla(97,72%,48%,0.3);
            transform: scale(1.02);
          }
        }

        @keyframes sparklePulse {
          0%, 100% {
            opacity: 0.8;
            filter: drop-shadow(0 0 8px hsl(174,56%,55%));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 12px hsl(174,56%,55%)) drop-shadow(0 0 20px hsl(97,72%,48%));
          }
        }

        @keyframes shimmerSweep {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }

        .sparkle-glow {
          animation: sparkleGlow 2s ease-in-out infinite;
          border-radius: 9999px;
        }

        .sparkle-pulse-icon {
          animation: sparklePulse 1.5s ease-in-out infinite;
        }

        .shimmer-effect {
          position: relative;
          overflow: hidden;
          border-radius: 9999px;
        }

        .shimmer-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            hsla(0,0%,100%,0.3),
            transparent
          );
          animation: shimmerSweep 2.5s infinite;
          z-index: 1;
          pointer-events: none;
        }
      `}</style>

      <div className={`relative ${variant === 'button' ? 'sparkle-glow shimmer-effect' : ''}`}>
        {variant === 'button' && (
          <>
            <div className="absolute -top-2 -left-2 pointer-events-none z-10">
              <SparklesIcon className="w-3 h-3 text-[hsl(97,72%,60%)] sparkle-pulse-icon" />
            </div>
            <div className="absolute -bottom-1 -right-1 pointer-events-none z-10">
              <SparklesIcon className="w-2.5 h-2.5 text-[hsl(197,86%,64%)] sparkle-pulse-icon" style={{ animationDelay: '0.5s' }} />
            </div>
          </>
        )}
        {children}
      </div>
    </>
  );
}
