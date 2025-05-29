import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (location: string, minPrice: number, maxPrice: number, type: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [type, setType] = useState('');

  const formatToRupiah = (value: string | number) => {
    if (!value) return '';
    const number = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(number)) return '';
    return 'Rp ' + number.toLocaleString('id-ID');
  };

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setState: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setState(rawValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(location, parseInt(minPrice) || 0, parseInt(maxPrice) || 1000000000, type);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-4 gap-4"
      >
        {/* Wilayah */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-900">Wilayah</label>
          <input
            type="text"
            placeholder="Masukkan wilayah"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
          />
        </div>

        {/* Harga Minimum */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-900">Harga Minimum</label>
          <input
            type="text"
            placeholder="Rp 0"
            value={formatToRupiah(minPrice)}
            onChange={(e) => handlePriceChange(e, setMinPrice)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
          />
        </div>

        {/* Harga Maksimum */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-900">Harga Maksimum</label>
          <input
            type="text"
            placeholder="Rp 10.000.000.000"
            value={formatToRupiah(maxPrice)}
            onChange={(e) => handlePriceChange(e, setMaxPrice)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
          />
        </div>

        {/* Tipe Jual */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-900">Tipe Jual</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
          >
            <option value="">Pilih tipe</option>
            <option value="jual">Jual</option>
            <option value="sewa">Sewa</option>
          </select>
        </div>

        {/* Tombol Search */}
        <button
          type="submit"
          className="p-4 bg-rose-500 text-white rounded-full hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
