import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getAuth } from 'firebase/auth';
import CSVUploader from '../components/CSVUploader';
import { ShieldAlert, Trash2, RefreshCw, Lock, Unlock, UserPlus } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from '../types';

const AdminPage: React.FC = () => {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        email: doc.data().email || '',
        displayName: doc.data().displayName || doc.data().email?.split('@')[0],
        role: doc.data().role || '',
        favorites: doc.data().favorites || [],
        disabled: doc.data().disabled || false,
      })) as User[];

      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (action: string, payload: any) => {
    try {
      const currentUser = getAuth().currentUser;
      const token = await currentUser?.getIdToken();
      const email = currentUser?.email;

      if (!token || !email) {
        throw new Error("No authenticated user");
      }

      const response = await fetch('/.netlify/functions/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, performedBy: email, ...payload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`Error during ${action}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;

    try {
      await handleUserAction('deleteUser', { userId });
      setUsers(users.filter(user => user.uid !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await handleUserAction('resetPassword', { email });
      alert(`Password reset email sent to ${email}`);
    } catch (err) {
      console.error('Error resetting password:', err);
    }
  };

  const handleToggleUserStatus = async (userId: string, isCurrentlyDisabled: boolean) => {
    try {
      await handleUserAction('toggleUserStatus', {
        userId,
        disabled: !isCurrentlyDisabled
      });

      setUsers(users.map(user =>
        user.uid === userId
          ? { ...user, disabled: !isCurrentlyDisabled }
          : user
      ));
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      await handleUserAction('changeUserRole', { userId, newRole });

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );

      alert(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = await handleUserAction('createUser', {
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });

      const newUserData: User = {
        uid: data.uid,
        email: newUser.email,
        displayName: newUser.email.split('@')[0],
        role: newUser.role,
        favorites: [],
        disabled: false
      };

      setUsers([...users, newUserData]);
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', role: '' });
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
            <p className="text-gray-600 mb-8">
              You need to be logged in to access the admin panel.
            </p>
            <a
              href="/login"
              className="px-6 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-700"
            >
              Log In
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!['admin'].includes(userData.role)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full text-red-600 mb-4">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-8">
              You don't have permission to access the admin panel.
            </p>
            <a
              href="/"
              className="px-6 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-700"
            >
              Back to Home
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Create User
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>

            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.uid} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{user.displayName || user.email}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.disabled && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            Disabled
                          </span>
                        )}
                        <div className="mt-2">
                          <label className="text-sm font-medium text-gray-700">Role: </label>
                          <select
                            value={user.role || 'user'}
                            onChange={(e) => handleChangeUserRole(user.uid, e.target.value)}
                            className="ml-2 p-1 border border-gray-300 rounded-md"
                          >
                            <option value="super">Super</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          title="Delete User"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.email)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                          title="Reset Password"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.uid, user.disabled ?? false)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full"
                          title={user.disabled ? "Enable User" : "Disable User"}
                        >
                          {user.disabled ? (
                            <Unlock className="h-5 w-5" />
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <CSVUploader />
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Bikin akun baru</h2>

            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">-- Select Role --</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super">Super</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
