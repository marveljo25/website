import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/config';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import { Heart } from 'lucide-react';

const FavoritesPage: React.FC = () => {
  const { userData } = useAuth();
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userData) return;

      setIsLoading(true);
      setError('');

      try {
        if (userData.favorites.length === 0) {
          setFavoriteProperties([]);
          setIsLoading(false);
          return;
        }

        const batchSize = 10; // optional batching, adjust as needed
        let allProperties: Property[] = [];

        for (let i = 0; i < userData.favorites.length; i += batchSize) {
          const batch = userData.favorites.slice(i, i + batchSize);

          const { data, error } = await supabase
            .from<Property>('properties')
            .select('*')
            .in('id', batch);

          if (error) throw error;

          if (data) {
            allProperties = [...allProperties, ...data];
          }
        }

        setFavoriteProperties(allProperties);
      } catch (err) {
        console.error('Error fetching favorite properties:', err);
        setError('Failed to load your favorite properties');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [userData]);

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
            <p className="text-gray-600 mb-8">
              You need to be logged in to view your favorite properties.
            </p>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Favorite Properties</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden h-80 animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : favoriteProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full text-blue-600 mb-4">
              <Heart className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't saved any properties to your favorites yet.
            </p>
            <a
              href="/search"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Browse Properties
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
