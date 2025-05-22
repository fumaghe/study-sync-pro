
import React from 'react';

interface ProgressRingProps {
  progress: number;
  radius: number;
  strokeWidth: number;
  color?: string;
  className?: string;
  labelFontSize?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  radius,
  strokeWidth,
  color = '#9b87f5',
  className = '',
  labelFontSize = 'text-xs',
}) => {
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="progress-ring-circle"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-medium ${labelFontSize}`}>
        {Math.round(progress)}%
      </div>
    </div>
  );
};

export default ProgressRing;
