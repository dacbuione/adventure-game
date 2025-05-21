
import React from 'react';

interface ChoiceButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ onClick, children, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-sky-500/50 transform hover:scale-105 transition-all duration-200 ease-in-out mb-4 text-md sm:text-lg focus:outline-none focus:ring-4 focus:ring-sky-400 focus:ring-opacity-75"
    >
      {children}
    </button>
  );
};

export default ChoiceButton;
