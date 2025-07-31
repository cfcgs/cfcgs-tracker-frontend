import React from 'react';
import { PuffLoader } from 'react-spinners';

const LoadingSpinner = () => {
  return (
    // Este container ocupa todo o espaço disponível e centraliza seu conteúdo
    <div className="flex-grow flex justify-center items-center h-full w-full">
      <PuffLoader color="#58A6FF" size={80} />
    </div>
  );
};

export default LoadingSpinner;