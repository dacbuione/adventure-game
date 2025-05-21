
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6 mb-4 sm:mb-8 text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600">
        Người Dệt Mộng Phiêu Lưu
      </h1>
      <p className="text-slate-300 mt-2 text-md sm:text-lg">Cuộc phiêu lưu văn bản động bằng AI đang chờ bạn!</p>
    </header>
  );
};

export default Header;