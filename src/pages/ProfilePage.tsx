import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { User, LogOut } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { currentUser, userData, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (!currentUser || !userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
            <p className="text-gray-600 mb-8">You need to be logged in to view your profile.</p>
            <a
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Log In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-blue-700 text-white p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {userData.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt={userData.displayName}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-blue-800 flex items-center justify-center">
                    <User className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold">{userData.displayName}</h1>
                <p className="text-blue-200">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Account Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="mt-1 text-sm text-gray-900">{userData.displayName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-sm text-gray-900">{userData.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {userData.role === 'super' ? 'Super User' : userData.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Saved Properties</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {userData.favorites.length}{' '}
                  {userData.favorites.length === 1 ? 'property' : 'properties'}
                </p>
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
