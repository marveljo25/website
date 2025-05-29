import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Edit, BedDouble, Bath } from 'lucide-react';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import PropertyForm from './PropertyForm';
interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const { userData, addToFavorites, removeFromFavorites } = useAuth();
  const [showEditForm, setShowEditForm] = useState(false);

  // Debugging: Check if property data exists
  if (!property) {
    console.warn("Property data is missing.");
    return <div className="text-red-500">No property data available.</div>;
  }

  // Debugging: Log the entire property object
  console.log("Rendering PropertyCard for:", property);

  // Handle potential issues with userData

  const isFavorite = userData?.favorites?.includes(property.id) || false;

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isFavorite) {
        await removeFromFavorites(property.id);
        console.log(`Removed from favorites: ${property.id}`);
      } else {
        await addToFavorites(property.id);
        console.log(`Added to favorites: ${property.id}`);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const formatPrice = (price: number) => {
    if (isNaN(price)) {
      console.error("Invalid price format:", price);
      return "N/A";
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace(/\u00A0/g, ' ');
  };


  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditForm(true);
    console.log("Edit button clicked for property:", property.id);
  };

  const canEdit = userData?.role === 'admin' || userData?.role === 'super';

  return (
    <>
      <Link to={`/property/${property.id}`} className="group">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0]}
                alt={property.type || 'Property'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-200">
                No Image Available
              </div>
            )}
            <div className="absolute top-3 right-3 flex gap-2">
              {userData && (
                <button
                  onClick={handleFavoriteToggle}
                  className="p-2 rounded-full bg-white/80 hover:bg-white"
                >
                  <Heart
                    className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`}
                  />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-full bg-white/80 hover:bg-white"
                >
                  <Edit className="h-5 w-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-bold">{formatPrice(property.hargaJual)}</p>
            <p className="font-medium text-[#333f48]">{property.judul || 'AAAS'}</p>
            <p className="text-sm text-[#8f9bb3]">{property.wilayah || 'Unknown Wilayah'}</p>
            <div className="mt-6 h-[1px] bg-gray-300 rounded" />
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <BedDouble className="w-4 h-4" />
                <span>{property.kamarTidur || '?'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{property.kamarMandi || '?'}</span>
              </div>
              {property.luasTanah && (
                <span>LT: {property.luasTanah} m²</span>
              )}
              {property.luasBangunan && (
                <span>LB: {property.luasBangunan} m²</span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {showEditForm && (
        <PropertyForm
          property={property}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => setShowEditForm(false)}
        />
      )}
    </>
  );
};

export default PropertyCard;
