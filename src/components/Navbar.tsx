import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { currentUser, logout, userData } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Gagal keluar', error);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img src="https://i.postimg.cc/v8rCtBpz/Screenshot-2025-05-11-114330.png" alt="CPRO Logo" className="h-8" />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rose-600">Beranda</Link>
            <Link to="/search" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rose-600">Cari</Link>
            {currentUser ? (
              <>
                <Link to="/favorites" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rose-600">Favorit</Link>
                <Link to="/profile" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rose-600">Profil</Link>
                {userData?.role === 'admin' && (
                  <>
                    <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rose-600">Admin</Link>
                    <Link to="/logs" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rose-6009">Logs</Link>
                  </>
                )}
                {(userData?.role === 'admin' || userData?.role === 'super') && (
                  <Link to="/property" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rose-600">Properties</Link>
                )}
                <button onClick={handleLogout} className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-700">Keluar</button>
              </>
            ) : (
              <Link to="/login" className="px-4 py-2 rounded-md text-sm font-medium text-rose-600 border border-rose-600 hover:bg-rose-50">Masuk</Link>
            )}
          </div>

          <div className="flex md:hidden items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rose-600">Beranda</Link>
            <Link to="/search" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rose-600">Cari</Link>
            {currentUser ? (
              <>
                <Link to="/favorites" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rose-600">Favorit</Link>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rose-600">Profil</Link>
                {userData?.role === 'admin' && (
                  <>
                    <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rose-600">Admin</Link>
                    <Link to="/logs" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rose-600">Logs</Link>
                  </>
                )}
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rose-600">Keluar</button>
              </>
            ) : (
              <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rose-600">Masuk</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
