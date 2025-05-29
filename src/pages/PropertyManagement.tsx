import React, { useRef, useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Trash2, Edit, Plus, ShieldAlert } from 'lucide-react';
import { supabase } from '../supabase/config';
import { Property } from '../types';
import PropertyForm from '../components/PropertyForm';
import { useAuth } from '../context/AuthContext';

const PropertyManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState('');
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProperties();
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < properties.length;
    }
  }, [selectedIds, properties.length]);

  const fetchProperties = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      setProperties(data as Property[]);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (deleteError) throw deleteError;
      setProperties(properties.filter(property => property.id !== propertyId));
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property');
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} properties?`)) return;

    try {
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .in('id', selectedIds);

      if (deleteError) throw deleteError;
      setProperties(properties.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error('Error deleting properties:', err);
      setError('Failed to delete selected properties');
    }
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowPropertyForm(true);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === properties.length ? [] : properties.map(p => p.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleDownloadCSV = () => {
    const selectedProperties = properties.filter(p => selectedIds.includes(p.id));

    const escapeCSV = (value: any) => {
      if (value == null) return '';
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      [
        'ID', 'Kode', 'Wilayah', 'Tipe', 'Status',
        'Cluster', 'Hadap', 'Luas Tanah', 'Luas Bangunan',
        'Lantai', 'Kamar Tidur', 'Kamar Mandi', 'Lain', 'Legal',
        'Harga Jual', 'Fee', 'Listing', 'Images', 'Tanggal', 'Timestamp'
      ],
      ...selectedProperties.map(p => [
        escapeCSV(p.id),
        escapeCSV(p.kode),
        escapeCSV(p.wilayah),
        escapeCSV(p.type),
        escapeCSV(p.status),
        escapeCSV(p.cluster),
        escapeCSV(p.hadap),
        escapeCSV(p.luasTanah),
        escapeCSV(p.luasBangunan),
        escapeCSV(p.lantai),
        escapeCSV(p.kamarTidur),
        escapeCSV(p.kamarMandi),
        escapeCSV(p.lain),
        escapeCSV(p.legal),
        escapeCSV(p.hargaJual),
        escapeCSV(p.fee),
        escapeCSV(p.listing),
        escapeCSV(p.images?.join(' | ')),
        escapeCSV(p.tanggal),
        escapeCSV(p.timestamp?.toDate?.().toISOString?.() || '')
      ])
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map(row => row.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'selected_properties.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
            <p className="text-gray-600 mb-8">
              You need to be logged in to access the property page.
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

  if (currentUser.role !== 'admin' && currentUser.role !== 'super') {
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
              You don't have permission to access the property page.
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
          <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
          <button
            onClick={() => setShowPropertyForm(true)}
            className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Property
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Manajemen Properti</h2>
            <div className="overflow-x-auto">
              {properties.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No properties found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          checked={properties.length > 0 && selectedIds.length === properties.length}
                          onChange={toggleSelectAll}
                          className="form-checkbox h-4 w-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500 hover:scale-110 transition-transform duration-150"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilayah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Jual</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {properties.map((property) => (
                      <tr key={property.id}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(property.id)}
                            onChange={() => toggleSelectOne(property.id)}
                            className="form-checkbox h-4 w-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500 hover:scale-110 transition-transform duration-150"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.kode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.wilayah}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${property.status === 'Tersedia' ? 'bg-green-100 text-green-800' :
                            property.status === 'JUAL' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {property.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            maximumFractionDigits: 0
                          }).format(Number(property.hargaJual))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditProperty(property)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-6 right-6 z-50 flex items-center justify-between bg-white border border-gray-200 shadow-lg rounded-2xl p-4 md:px-6 transition-all">
                  <span className="text-sm text-gray-700 font-medium">
                    {selectedIds.length} selected
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownloadCSV}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Download CSV
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showPropertyForm && (
        <PropertyForm
          property={selectedProperty}
          onClose={() => setShowPropertyForm(false)}
          onSuccess={fetchProperties}
        />
      )}
    </div>
  );
};

export default PropertyManagement;