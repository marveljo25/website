import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase/config';
import { Property } from '../types';
import Navbar from '../components/Navbar';
import ImageGallery from '../components/ImageGallery';
import {
  Home,
  Building2,
  Landmark,
  MapPin,
  Layers,
  Ruler,
  Move3D,
  FileText,
  BadgeInfo,
  Tags,
  Calendar,
  ClipboardCheck,
  ClipboardSignature,
  ClipboardList,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, addToFavorites, removeFromFavorites } = useAuth();

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      try {
        const { data, error: supabaseError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (supabaseError) throw supabaseError;
        if (data) {
          setProperty(data as Property);
        } else {
          setError('Property not found');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const isFavorite = currentUser?.favorites.includes(id || '') || false;

  const handleFavoriteToggle = async () => {
    if (!id) return;
    try {
      if (isFavorite) {
        await removeFromFavorites(id);
      } else {
        await addToFavorites(id);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Rest of the component remains the same...
  // Include all the JSX from the original PropertyDetailsPage component

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Include all the JSX from the original component */}
    </div>
  );
};

export default PropertyDetailsPage;