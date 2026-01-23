import React from 'react';
import { PuffLoader } from 'react-spinners';

const SIZE_MAP = {
  xs: 18,
  sm: 24,
  md: 48,
  lg: 80,
};

const LoadingSpinner = ({ size = 80, text, inline = false, className = '' }) => {
  const resolvedSize = typeof size === 'string' ? (SIZE_MAP[size] ?? SIZE_MAP.lg) : size;
  const spinner = <PuffLoader color="#58A6FF" size={resolvedSize} />;

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {spinner}
        {text ? <span className="text-xs text-dark-text-secondary">{text}</span> : null}
      </span>
    );
  }

  return (
    <div className={`flex-grow flex flex-col justify-center items-center h-full w-full ${className}`}>
      {spinner}
      {text ? <div className="mt-2 text-sm text-dark-text-secondary">{text}</div> : null}
    </div>
  );
};

export default LoadingSpinner;
