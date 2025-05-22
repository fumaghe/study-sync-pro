
import React from 'react';

interface ProgressRingProps {
  progress: number;
  radius: number;
  strokeWidth: number;
  color?: string;
  className?: string;
  labelFontSize?: string;
  showLabel?: boolean;
  growthStage?: 'seed' | 'sprout' | 'growing' | 'mature';
  theme?: 'tomato' | 'plant' | 'book';
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  radius,
  strokeWidth,
  color = '#9b87f5',
  className = '',
  labelFontSize = 'text-xs',
  showLabel = true,
  growthStage,
  theme = 'tomato'
}) => {
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Get color based on progress
  const getProgressColor = () => {
    if (theme === 'tomato') {
      if (progress < 25) return '#A8E063'; // Green
      if (progress < 50) return '#F9D030'; // Yellow
      if (progress < 75) return '#FF8B3D'; // Orange
      return '#FF5252'; // Red - fully ripe tomato
    }
    return color; // Default to provided color
  };
  
  // Render appropriate theme element
  const renderThemeElement = () => {
    if (theme === 'tomato') {
      return renderTomato();
    } else if (theme === 'plant') {
      return renderPlant();
    } else if (theme === 'book') {
      return renderBook();
    }
    return null;
  };
  
  // Render tomato at different growth stages
  const renderTomato = () => {
    // Reduced size to avoid overflowing container
    const size = radius * 0.9;
    const tomatoColor = getProgressColor();
    
    if (progress < 25) {
      // Small green tomato
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" fill="#A8E063" />
            <path d="M50 20 L50 5" stroke="#2E7D32" strokeWidth="3" />
            <path d="M50 5 Q55 0 60 5" stroke="#2E7D32" strokeWidth="3" fill="none" />
          </svg>
        </div>
      );
    } else if (progress < 50) {
      // Medium yellowish tomato
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="35" fill="#F9D030" />
            <path d="M50 15 L50 0" stroke="#2E7D32" strokeWidth="3" />
            <path d="M50 0 Q55 -5 60 0" stroke="#2E7D32" strokeWidth="3" fill="none" />
          </svg>
        </div>
      );
    } else if (progress < 75) {
      // Larger orange tomato
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="#FF8B3D" />
            <path d="M50 10 L50 -5" stroke="#2E7D32" strokeWidth="3" />
            <path d="M50 -5 Q55 -10 60 -5" stroke="#2E7D32" strokeWidth="3" fill="none" />
          </svg>
        </div>
      );
    } else {
      // Full ripe tomato
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#FF5252" />
            <path d="M50 5 L50 -10" stroke="#2E7D32" strokeWidth="3" />
            <path d="M50 -10 Q55 -15 60 -10" stroke="#2E7D32" strokeWidth="3" fill="none" />
            {progress === 100 && (
              <g className="animate-pulse">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#FFEB3B" strokeWidth="2" />
              </g>
            )}
          </svg>
        </div>
      );
    }
  };
  
  // Render plant at different growth stages with reduced size
  const renderPlant = () => {
    // Reduced size to prevent overflow
    const size = radius * 0.9;
    
    if (progress < 25) {
      // Seed
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 100 100">
            <ellipse cx="50" cy="60" rx="15" ry="10" fill="#8B4513" />
            <path d="M50 60 L50 40" stroke="#8B4513" strokeWidth="2" />
          </svg>
        </div>
      );
    } else if (progress < 50) {
      // Sprout
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 100 100">
            <ellipse cx="50" cy="70" rx="15" ry="10" fill="#8B4513" />
            <path d="M50 70 L50 40" stroke="#2E7D32" strokeWidth="3" />
            <path d="M50 50 Q60 45 65 50" stroke="#2E7D32" strokeWidth="2" fill="none" />
            <path d="M50 60 Q40 55 35 60" stroke="#2E7D32" strokeWidth="2" fill="none" />
          </svg>
        </div>
      );
    } else if (progress < 75) {
      // Growing plant
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 100 100">
            <ellipse cx="50" cy="80" rx="15" ry="5" fill="#8B4513" />
            <path d="M50 80 L50 30" stroke="#2E7D32" strokeWidth="3" />
            <path d="M50 60 Q65 55 70 60" stroke="#2E7D32" strokeWidth="2" fill="none" />
            <path d="M50 70 Q35 65 30 70" stroke="#2E7D32" strokeWidth="2" fill="none" />
            <path d="M50 50 Q60 45 65 50" stroke="#2E7D32" strokeWidth="2" fill="none" />
            <path d="M50 40 Q40 35 35 40" stroke="#2E7D32" strokeWidth="2" fill="none" />
          </svg>
        </div>
      );
    } else {
      // Full plant
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 100 100">
            <ellipse cx="50" cy="85" rx="15" ry="5" fill="#8B4513" />
            <path d="M50 85 L50 20" stroke="#2E7D32" strokeWidth="3" />
            <path d="M50 70 Q70 65 75 70" stroke="#2E7D32" strokeWidth="2" fill="none" />
            <path d="M50 80 Q30 75 25 80" stroke="#2E7D32" strokeWidth="2" fill="none" />
            <path d="M50 60 Q65 55 70 60" stroke="#2E7D32" strokeWidth="2" fill="none" />
            <path d="M50 50 Q35 45 30 50" stroke="#2E7D32" strokeWidth="2" fill="none" />
            <path d="M50 40 Q60 35 65 40" stroke="#2E7D32" strokeWidth="2" fill="none" />
            <path d="M50 30 Q40 25 35 30" stroke="#2E7D32" strokeWidth="2" fill="none" />
            {progress === 100 && (
              <g className="animate-pulse">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#FFEB3B" strokeWidth="2" />
              </g>
            )}
          </svg>
        </div>
      );
    }
  };
  
  // Render book at different opening stages with reduced size
  const renderBook = () => {
    const size = radius * 0.9;
    const openAngle = Math.min(180, (progress / 100) * 180);
    
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width={size} height={size} viewBox="0 0 100 100">
          {/* Book spine */}
          <rect x="48" y="30" width="4" height="40" fill="#8B4513" />
          
          {/* Left page */}
          <g transform={`rotate(${-openAngle/2} 50 50)`}>
            <rect x="10" y="30" width="38" height="40" fill="#F5F5DC" stroke="#8B4513" />
            
            {/* Text lines - left page */}
            <line x1="18" y1="40" x2="40" y2="40" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="18" y1="45" x2="40" y2="45" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="18" y1="50" x2="40" y2="50" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="18" y1="55" x2="40" y2="55" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="18" y1="60" x2="30" y2="60" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
          </g>
          
          {/* Right page */}
          <g transform={`rotate(${openAngle/2} 50 50)`}>
            <rect x="52" y="30" width="38" height="40" fill="#F5F5DC" stroke="#8B4513" />
            
            {/* Text lines - right page */}
            <line x1="60" y1="40" x2="82" y2="40" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="60" y1="45" x2="82" y2="45" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="60" y1="50" x2="82" y2="50" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="60" y1="55" x2="82" y2="55" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="60" y1="60" x2="72" y2="60" stroke="#333" strokeWidth="1" strokeDasharray="2,1" />
          </g>
          
          {progress === 100 && (
            <g className="animate-pulse">
              <circle cx="50" cy="50" r="48" fill="none" stroke="#FFEB3B" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg]"
      >
        {/* Background circle */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-muted opacity-20"
        />
        {/* Progress circle */}
        <circle
          stroke={getProgressColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="progress-ring-circle transition-all duration-300 ease-in-out"
        />
      </svg>
      
      {/* Theme visualization */}
      {renderThemeElement()}
      
      {/* Time display or percentage */}
      {showLabel && (
        <div className={`absolute inset-0 flex items-center justify-center font-medium ${labelFontSize}`}>
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
