import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
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

// ...imports remain the same

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { userData, addToFavorites, removeFromFavorites } = useAuth();

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      try {
        const propertyDoc = await getDoc(doc(db, 'properties', id));
        if (propertyDoc.exists()) {
          setProperty({ id: propertyDoc.id, ...propertyDoc.data() } as Property);
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

  const isFavorite = userData?.favorites.includes(id || '') || false;

  const handleFavoriteToggle = async () => {
    if (!id) return;
    if (isFavorite) {
      await removeFromFavorites(id);
    } else {
      await addToFavorites(id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="animate-pulse"> {/* loading skeletons */} </div>
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
            <p className="text-gray-600 mb-8">The property you're looking for might have been removed or doesn't exist.</p>
            <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Back to Home
            </a>
          </div>
        ) : property ? (
          <>
            <div className="mb-8">
              <ImageGallery media={property.images} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                  {property.type}
                </div>
                <div className="text-3xl font-bold text-blue-600">{formatPrice(property.hargaJual)}</div>
                {/* Judul */}
                {property.judul && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-gray-700 whitespace-pre-line">{property.judul}</p>
                  </div>
                )}
                {/* Key Info */}
                <div className="mt-6 h-[1px] bg-gray-300 rounded" />
                <h2 className="text-xl font-semibold mb-4">Informasi Properti</h2>
                <div className="bg-white rounded-lg">
                  <h2 className="text-base font-semibold mb-4">Spesifikasi</h2>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 text-gray-700">
                    <div className="flex items-center"><MapPin className="w-5 h-5 mr-2" />Wilayah: {property.wilayah}</div>
                    <div className="flex items-center"><Home className="w-5 h-5 mr-2" />Tipe: {property.type}</div>
                    <div className="flex items-center"><ClipboardCheck className="w-5 h-5 mr-2" />Status: {property.status}</div>
                    <div className="flex items-center"><Calendar className="w-5 h-5 mr-2" />Tanggal: {property.tanggal}</div>
                    <div className="flex items-center"><Landmark className="w-5 h-5 mr-2" />Cluster: {property.cluster}</div>
                    <div className="flex items-center"><Building2 className="w-5 h-5 mr-2" />Hadap: {property.hadap}</div>
                    <div className="flex items-center"><Move3D className="w-5 h-5 mr-2" />Luas Tanah: {property.luasTanah}</div>
                    <div className="flex items-center"><Ruler className="w-5 h-5 mr-2" />Luas Bangunan: {property.luasBangunan}</div>
                    <div className="flex items-center"><Layers className="w-5 h-5 mr-2" />Lantai: {property.lantai}</div>
                    <div className="flex items-center"><BadgeInfo className="w-5 h-5 mr-2" />Legal: {property.legal}</div>
                    <div className="flex items-center"><ClipboardList className="w-5 h-5 mr-2" />Kamar Tidur: {property.kamarTidur}</div>
                    <div className="flex items-center"><ClipboardList className="w-5 h-5 mr-2" />Kamar Mandi: {property.kamarMandi}</div>
                    <div className="flex items-center"><ClipboardSignature className="w-5 h-5 mr-2" />Fee: {property.fee}</div>
                    <div className="flex items-center"><FileText className="w-5 h-5 mr-2" />Listing: {property.listing}</div>
                    <div className="flex items-center"><Tags className="w-5 h-5 mr-2" />Harga Jual: {formatPrice(property.hargaJual)}</div>
                    <div className="flex items-center"><Calendar className="w-5 h-5 mr-2" />Updated: {property.timestamp?.toDate().toLocaleString()}</div>
                  </div>
                  {property.lain && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h2 className="text-xl font-semibold mb-2">Informasi Tambahan</h2>
                      <p className="text-gray-700 whitespace-pre-line">{property.lain}</p>
                    </div>
                  )}
                </div>
                {/* Deskripsi */}
                {property.description?.trim() && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-gray-700 whitespace-pre-line break-words">
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Extra Info */}
              </div>

              {/* Sidebar */}
              <div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  {userData ? (
                    <button
                      onClick={handleFavoriteToggle}
                      className={`w-full flex justify-center items-center px-4 py-2 rounded-md text-sm font-medium mb-4 ${isFavorite
                        ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      <Heart className={`h-5 w-5 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
                    </button>
                  ) : (
                    <a
                      href="/login"
                      className="w-full flex justify-center items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 mb-4"
                    >
                      <Heart className="h-5 w-5 mr-2" />
                      Login to Save
                    </a>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
