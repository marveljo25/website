import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/config';
import { Property } from '../types';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import { SlidersHorizontal } from 'lucide-react';

const SearchPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    wilayah: '',
    jenisPemasaran: '',
    hargaMin: 0,
    hargaMax: Infinity,
    kamarTidur: 0,
    kamarMandi: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setFilters({
      wilayah: params.get('wilayah') || '',
      jenisPemasaran: params.get('jenisPemasaran') || '',
      hargaMin: parseInt(params.get('hargaMin') || '0'),
      hargaMax: parseInt(params.get('hargaMax') || '1000000000'),
      kamarTidur: parseInt(params.get('kamarTidur') || '0'),
      kamarMandi: parseInt(params.get('kamarMandi') || '0'),
    });

    setCurrentPage(0);
    setHasMore(true);
  }, [window.location.search]);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError('');

      try {
        let query = supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
          .range(0, ITEMS_PER_PAGE - 1);

        if (filters.wilayah) {
          query = query.ilike('wilayah', `%${filters.wilayah}%`);
        }
        if (filters.hargaMin > 0) {
          query = query.gte('hargaJual', filters.hargaMin);
        }
        if (filters.hargaMax < 1000000000) {
          query = query.lte('hargaJual', filters.hargaMax);
        }
        if (filters.kamarTidur > 0) {
          query = query.gte('kamarTidur', filters.kamarTidur);
        }
        if (filters.kamarMandi > 0) {
          query = query.gte('kamarMandi', filters.kamarMandi);
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) throw supabaseError;

        setProperties(data as Property[]);
        setHasMore(data.length === ITEMS_PER_PAGE);
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
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const start = nextPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE - 1;

    try {
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end);

      if (filters.wilayah) {
        query = query.ilike('wilayah', `%${filters.wilayah}%`);
      }
      if (filters.hargaMin > 0) {
        query = query.gte('hargaJual', filters.hargaMin);
      }
      if (filters.hargaMax < 1000000000) {
        query = query.lte('hargaJual', filters.hargaMax);
      }
      if (filters.kamarTidur > 0) {
        query = query.gte('kamarTidur', filters.kamarTidur);
      }
      if (filters.kamarMandi > 0) {
        query = query.gte('kamarMandi', filters.kamarMandi);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      if (data) {
        setProperties(prev => [...prev, ...data]);
        setHasMore(data.length === ITEMS_PER_PAGE);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error('Error loading more properties:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (wilayah: string, hargaMin: number, hargaMax: number) => {
    const params = new URLSearchParams();

    if (wilayah) params.set('wilayah', wilayah);
    if (hargaMin > 0) params.set('hargaMin', hargaMin.toString());
    if (hargaMax < 1000000000) params.set('hargaMax', hargaMax.toString());

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

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: ['hargaMin', 'hargaMax', 'kamarTidur', 'kamarMandi'].includes(name)
        ? Number(value)
        : value,
    }));
  };

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

  const resetFilters = () => {
    setFilters({
      wilayah: '',
      jenisPemasaran: '',
      hargaMin: 0,
      hargaMax: 1000000000,
      kamarTidur: 0,
      kamarMandi: 0,
    });
    window.history.pushState({}, '', '/search');
  };

  const isFilterActive = () => {
    return (
      filters.wilayah !== '' ||
      filters.hargaMin !== 0 ||
      filters.hargaMax !== 1000000000 ||
      filters.kamarTidur !== 0 ||
      filters.kamarMandi !== 0
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
                    className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
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
            {/* Mobile Filter Button */}
            <div className="flex justify-between mb-4">
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
                      Kamar Tidur
                    </label>
                    <select
                      name="kamarTidur"
                      value={filters.kamarTidur}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
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
                      className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
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
                      className="px-6 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:bg-rose-400"
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