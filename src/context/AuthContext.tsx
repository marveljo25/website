import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../supabase/config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addToFavorites: (propertyId: string) => Promise<void>;
  removeFromFavorites: (propertyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && userData) {
          setCurrentUser(userData as User);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const addToFavorites = async (propertyId: string) => {
    if (!currentUser) return;

    const newFavorites = [...currentUser.favorites, propertyId];
    const { error } = await supabase
      .from('users')
      .update({ favorites: newFavorites })
      .eq('id', currentUser.id);

    if (error) throw error;
    setCurrentUser({ ...currentUser, favorites: newFavorites });
  };

  const removeFromFavorites = async (propertyId: string) => {
    if (!currentUser) return;

    const newFavorites = currentUser.favorites.filter(id => id !== propertyId);
    const { error } = await supabase
      .from('users')
      .update({ favorites: newFavorites })
      .eq('id', currentUser.id);

    if (error) throw error;
    setCurrentUser({ ...currentUser, favorites: newFavorites });
  };

  const value = {
    currentUser,
    loading,
    login,
    loginWithGoogle,
    logout,
    addToFavorites,
    removeFromFavorites,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};