import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Property } from '../types';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import { SlidersHorizontal } from 'lucide-react';

const SearchPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    wilayah: '',
    jenisPemasaran: '',
    hargaMin: 0,
    hargaMax: Infinity,
    kamarTidur: 0,
    kamarMandi: 0,
  });
  const [showFilters, setShowFilters] = useState(false);


  // Parse query parameters from URL (runs on mount and when URL search changes)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setFilters({
      wilayah: params.get('wilayah') || '',
      jenisPemasaran: params.get('jenisPemasaran') || '',
      hargaMin: parseInt(params.get('hargaMin') || '0'),
      hargaMax: parseInt(params.get('hargaMax') || '1000000000'),
      kamarTidur: parseInt(params.get('kamarTidur') || '0'),
      kamarMandi: parseInt(params.get('kamarMandi') || '0'), // Fixed here
    });

    setLastVisible(null);
    setHasMore(true);
  }, [window.location.search]); // Watch URL changes (optional: can use React Router for better sync)

  // Fetch properties based on filters
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError('');

      try {
        const qRef = collection(db, 'properties');
        const constraints: any[] = [];

        // Apply filters only if they have meaningful values
        if (filters?.wilayah) {
          constraints.push(where('wilayah', '==', filters.wilayah));
        }
        if (filters?.hargaMin && filters.hargaMin > 0) {
          constraints.push(where('hargaJual', '>=', filters.hargaMin));
        }
        if (filters?.hargaMax && filters.hargaMax < 1000000000) {
          constraints.push(where('hargaJual', '<=', filters.hargaMax));
        }
        if (filters?.kamarTidur && filters.kamarTidur > 0) {
          constraints.push(where('kamarTidur', '>=', filters.kamarTidur));
        }
        if (filters?.kamarMandi && filters.kamarMandi > 0) {
          constraints.push(where('kamarMandi', '>=', filters.kamarMandi));
        }

        // Always order by tanggal desc and limit the results
        const propertyQuery = query(
          qRef,
          ...constraints,
          orderBy('tanggal', 'desc'),
          limit(12)
        );

        const snapshot = await getDocs(propertyQuery);

        const propertyData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Property[];

        setProperties(propertyData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === 12);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  const loadMoreProperties = async () => {
    if (!lastVisible || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const qRef = collection(db, 'properties');
      const constraints = [];

      // Apply filters
      if (filters.wilayah) {
        constraints.push(where('wilayah', '==', filters.wilayah));
      }
      if (filters.hargaMin > 0) {
        constraints.push(where('hargaJual', '>=', filters.hargaMin));
      }
      if (filters.hargaMax < 1000000000) {
        constraints.push(where('hargaJual', '<=', filters.hargaMax));
      }
      if (filters.kamarTidur > 0) {
        constraints.push(where('kamarTidur', '>=', filters.kamarTidur));
      }
      if (filters.kamarMandi > 0) {
        constraints.push(where('kamarMandi', '>=', filters.kamarMandi));
      }

      const propertyQuery = query(
        qRef,
        ...constraints,
        orderBy('tanggal', 'desc'),
        startAfter(lastVisible),
        limit(12)
      );

      const snapshot = await getDocs(propertyQuery);

      const newProperties = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Property[];

      setProperties((prev) => [...prev, ...newProperties]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 12);
    } catch (err) {
      console.error('Error loading more properties:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Update search filters via SearchBar (wilayah, hargaMin, hargaMax)
  const handleSearch = (wilayah: string, hargaMin: number, hargaMax: number) => {
    const params = new URLSearchParams();

    if (wilayah) params.set('wilayah', wilayah);
    if (hargaMin > 0) params.set('hargaMin', hargaMin.toString());
    if (hargaMax < 1000000000) params.set('hargaMax', hargaMax.toString());

    // Preserve existing filters for kamarTidur, kamarMandi, featured
    if (filters.kamarTidur > 0) params.set('kamarTidur', filters.kamarTidur.toString());
    if (filters.kamarMandi > 0) params.set('kamarMandi', filters.kamarMandi.toString());

    window.history.pushState({}, '', `/search?${params.toString()}`);

    setFilters((prev) => ({
      ...prev,
      wilayah,
      hargaMin,
      hargaMax,
    }));
  };

  // Handle filter changes, parse numbers where needed
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target;

    // Check if it's an input of type checkbox to access checked
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      const { name, checked } = target;
      setFilters(prev => ({ ...prev, [name]: checked }));
    } else {
      // For select and other inputs, use value
      const { name, value } = target;
      setFilters(prev => ({
        ...prev,
        [name]:
          // if numeric fields, parse as number
          name === 'hargaMin' || name === 'hargaMax' || name === 'kamarTidur' || name === 'kamarMandi'
            ? Number(value)
            : value,
      }));
    }
  };


  // Apply filters: update URL and close mobile filter
  const applyFilters = () => {
    const params = new URLSearchParams();

    if (filters.wilayah) params.set('wilayah', filters.wilayah);
    if (filters.hargaMin > 0) params.set('hargaMin', filters.hargaMin.toString());
    if (filters.hargaMax < 1000000000) params.set('hargaMax', filters.hargaMax.toString());
    if (filters.kamarTidur > 0) params.set('kamarTidur', filters.kamarTidur.toString());
    if (filters.kamarMandi > 0) params.set('kamarMandi', filters.kamarMandi.toString());

    window.history.pushState({}, '', `/search?${params.toString()}`);

    if (window.innerWidth < 768) {
      setShowFilters(false);
    }
  };

  // Reset filters to defaults
  const resetFilters = () => {
    setFilters({
      wilayah: '',
      jenisPemasaran: '',
      hargaMin: 0,
      hargaMax: 1000000000,
      kamarTidur: 0,
      kamarMandi: 0,
    });
  };
  const isFilterActive = () => {
    return (
      filters.wilayah !== '' ||
      (filters.hargaMin !== 0 && filters.hargaMin !== null) ||
      (filters.hargaMax !== 1000000000 && filters.hargaMax !== null) ||
      (filters.kamarTidur !== 0 && filters.kamarTidur !== null) ||
      (filters.kamarMandi !== 0 && filters.kamarMandi !== null)
    );
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Properties</h1>
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Panel (Desktop) */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kamar Tidur
                  </label>
                  <select
                    name="kamarTidur"
                    value={filters.kamarTidur}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="0">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kamar Mandi
                  </label>
                  <select
                    name="kamarMandi"
                    value={filters.kamarMandi}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="0">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>

                <div className="pt-4 flex flex-col space-y-2">
                  <button
                    onClick={applyFilters}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow">
            {/* View Toggle and Mobile Filter Button */}
            <div className="flex justify-between mb-4">

              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden px-3 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-100 flex items-center"
              >
                <SlidersHorizontal className="h-5 w-5 mr-1" />
                Filters
              </button>
            </div>

            {/* Mobile Filters Panel */}
            {showFilters && (
              <div className="md:hidden bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      kamarTidur
                    </label>
                    <select
                      name="kamarTidur"
                      value={filters.kamarTidur}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="0">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kamar Mandi
                    </label>
                    <select
                      name="kamarMandi"
                      value={filters.kamarMandi}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="0">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>

                  <div className="pt-4 flex space-x-2">
                    <button
                      onClick={applyFilters}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Apply
                    </button>
                    <button
                      onClick={resetFilters}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Count */}
            {!isLoading && isFilterActive() && (
              <div className="mb-4 text-gray-600">
                {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
              </div>
            )}



            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md overflow-hidden h-80 animate-pulse"
                  >
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No properties found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search filters to find more properties.
                    </p>
                  </div>
                )}

                {/* Load More Button */}
                {hasMore && properties.length > 0 && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMoreProperties}
                      disabled={isLoadingMore}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                    >
                      {isLoadingMore ? 'Loading...' : 'Load More Properties'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;