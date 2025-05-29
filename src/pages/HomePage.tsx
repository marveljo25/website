import React, { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Property } from '../types';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import { Building ,Home, MapPin, Briefcase, LucideHome}from 'lucide-react';

const PROPERTY_TYPES = [
  { icon: LucideHome, label: 'All', id: 'ALL' },  // Added "All" option
  { icon: Building, label: 'Apartemen', id: 'APARTEMEN' },
  { icon: MapPin, label: 'Kavling', id: 'KAVLING' },
  { icon: Briefcase, label: 'Ruko', id: 'RUKO' },
  { icon: Home, label: 'Rumah', id: 'RUMAH' },
];

const HomePage: React.FC = () => {
  const [selectedType, setSelectedType] = useState('ALL');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        let q;
        if (selectedType ==='ALL') {
          q = query(
            collection(db, 'properties'),
            limit(100)
          );
        } else {
          // Firestore requires composite index for where + orderBy on different fields.
          // If you have not created it, this query will throw.
          q = query(
            collection(db, 'properties'),
            where('type', '==', selectedType),
            limit(100)
          );
        }
        const snapshot = await getDocs(q);
        const propertyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Property[];
        setProperties(propertyData);
      } catch (err: any) {
        console.error('Error mengambil data properti:', err);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [selectedType]);

  const handleSearch = (location: string, minPrice: number, maxPrice: number) => {
    window.location.href = `/search?location=${encodeURIComponent(location)}&minPrice=${minPrice}&maxPrice=${maxPrice}`;
  };
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>
        
        {/* Tipe Properti */}
        <div className="mb-8">
          <div className="flex space-x-8 overflow-x-auto pb-4">
            {PROPERTY_TYPES.map(({ icon: Icon, label, id }) => (
              <button
                key={id}
                onClick={() => setSelectedType(id)}
                className={`flex flex-col items-center space-y-2 min-w-[80px] ${
                  selectedType === id
                    ? 'text-rose-500 border-b-2 border-rose-500'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Daftar Properti */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-xl mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;