import React from 'react';

const TopLoader = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-1 bg-transparent overflow-hidden pointer-events-none">
      <div className="h-full bg-[#9146FF] animate-progress origin-left w-full" />
      <style jsx>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.5); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TopLoader;
