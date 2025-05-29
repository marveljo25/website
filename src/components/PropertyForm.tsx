import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Property } from '../types';
import { X } from 'lucide-react';
import PictureVideoUploader from './PictureVideoUploader';

interface PropertyFormProps {
  property?: Property;
  onClose: () => void;
  onSuccess: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ property, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    kode: property?.kode || 0,
    wilayah: property?.wilayah || '',
    type: property?.type || '',
    status: property?.status || '',
    tanggal: property?.tanggal || '',
    cluster: property?.cluster || '',
    hadap: property?.hadap || '',
    luasTanah: property?.luasTanah || 0,
    luasBangunan: property?.luasBangunan || 0,
    lantai: property?.lantai || 1,
    kamarTidur: property?.kamarTidur || '',
    kamarMandi: property?.kamarMandi || '',
    lain: property?.lain || '',
    legal: property?.legal || '',
    legalCustom: '',                           // Temporary variable
    hargaJual: property?.hargaJual || 0,
    fee: property?.fee || '',
    listing: property?.listing || '',
    images: property?.images || [],
    judul: property?.judul || '',
    description: property?.description || ''
  });

  const [error, setError] = useState('');
  const [deletingImages, setDeletingImages] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (urls: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...urls],
    }));
  };
  const formatToRupiah = (value: string | number) => {
    if (!value) return 'Rp ';
    const number = typeof value === 'string' ? parseInt(value) : value;
    return 'Rp ' + number.toLocaleString('id-ID');
  };


  const handleRemoveImage = async (indexToRemove: number) => {
    const imageUrl = formData.images[indexToRemove];
    setDeletingImages(prev => [...prev, indexToRemove]);

    try {
      // Extract public_id from the URL
      const urlParts = imageUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];

      // Call Netlify function to delete from Cloudinary
      const response = await fetch('/.netlify/functions/cloudinary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          action: 'delete'
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete image');
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from local state
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, idx) => idx !== indexToRemove),
      }));
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(`Failed to delete image: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDeletingImages(prev => prev.filter(idx => idx !== indexToRemove));
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {

    const { name, value } = e.target;

    const numericFields = ['kode', 'luasTanah', 'lantai', 'luasBangunan', 'kamarTidur', 'kamarMandi', 'hargaJual'];
    if (name === 'hargaJual') {
      const numericValue = Number(value.replace(/\D/g, '')); // Convert to number

      setFormData(prev => ({
        ...prev,
        hargaJual: numericValue, // Only store the raw number
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    if (numericFields.includes(name) && !/^\d*$/.test(value)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cluster' ? value.toUpperCase() : value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    // Convert necessary fields to numbers once
    const dataToSave = {
      ...formData,
      kode: Number(formData.kode) || 0,
      luasTanah: Number(formData.luasTanah) || 0,
      lantai: Number(formData.lantai) || 0,
      luasBangunan: Number(formData.luasBangunan) || 0,
      kamarTidur: Number(formData.kamarTidur) || 0,
      kamarMandi: Number(formData.kamarMandi) || 0,
      hargaJual: Number(formData.hargaJual) || 0,
      legal:
        formData.legal === 'LAIN_LAIN' && formData.legalCustom.trim().toUpperCase() !== ''
          ? formData.legalCustom
          : formData.legal,
    };

    try {
      if (property?.id) {
        const propertyRef = doc(db, 'properties', property.id);
        await updateDoc(propertyRef, {
          ...dataToSave,
          timestamp: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'properties'), {
          ...dataToSave,
          tanggal: `${day}-${month}-${year}`,
          timestamp: serverTimestamp(),
        });
      }
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error saving property:', err);
      setError('Gagal menyimpan properti. Pastikan data anda terisi semua.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = async () => {
    if (!property?.id && formData.images.length > 0) {
      try {

        for (const imgUrl of formData.images) {
          const urlParts = imgUrl.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExtension.split('.')[0];

          const response = await fetch('/.netlify/functions/cloudinary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              public_id: publicId,
              action: 'delete',
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            console.error('Failed to delete:', imgUrl, text);
          } else {
            const result = await response.json();
            if (result.error) {
              console.error('Cloudinary error:', result.error);
            }
          }
        }
      } catch (err) {
        console.error('Error deleting uploaded images on close:', err);
      }
    }
    onClose(); // call the original close function
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{property ? 'Edit Properti' : 'Tambah Properti Baru'}</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className={`p-2 hover:bg-gray-100 rounded-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Close form"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
            <PictureVideoUploader onUploadComplete={handleImageUpload} />
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {formData.images.map((imgUrl, index) => (
                  <div key={index} className="relative group">
                    {imgUrl.match(/\.(mp4|mov|avi)$/i) ? (
                      <video
                        src={imgUrl}
                        controls
                        className="w-full h-32 object-cover rounded shadow"
                      />
                    ) : (
                      <img
                        src={imgUrl}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-32 object-cover rounded shadow"
                      />
                    )}
                    <button
                      onClick={() => handleRemoveImage(index)}
                      disabled={deletingImages.includes(index)}
                      className={`absolute top-2 right-2 p-1 rounded-md shadow-md transition duration-150 ease-in-out opacity-0 group-hover:opacity-100 ${deletingImages.includes(index)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-white text-red-500 hover:bg-red-500 hover:text-white'
                        }`}
                      title="Hapus"
                    >
                      {deletingImages.includes(index) ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Judul */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Judul</label>
              <input
                type="text"
                name="judul"
                value={formData.judul}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={1020} // 👈 set your desired limit here
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1020 karakter</p>
            </div>

            {/* Kode */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Kode</label>
              <input
                type="text"
                name="kode"
                value={formData.kode}
                onChange={handleChange}
                pattern="^[0-9]*$"  // Restrict to numbers only
                required
                placeholder="123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Wilayah */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Wilayah (HURUF BESAR)</label>
              <input
                type="text"
                name="wilayah"
                value={formData.wilayah}
                onChange={handleChange}
                pattern="[A-Z\s]*"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Pilih tipe</option>
                <option value="RUKO">RUKO</option>
                <option value="RUMAH">RUMAH</option>
                <option value="KAVLING">KAVLING</option>
                <option value="APARTERMEN">APARTERMEN</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Jenis Pemasaran</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Pilih jenis</option>
                <option value="JUAL">Jual</option>
                <option value="SEWA">Sewa</option>
              </select>
            </div>

            {/* Cluster */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Cluster(HURUF BESAR)</label>
              <input
                type="text"
                name="cluster"
                value={formData.cluster}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Hadap */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Hadap</label>
              <select
                name="hadap"
                value={formData.hadap}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Pilih arah</option>
                <option value="UTARA">Utara</option>
                <option value="TIMUR">Timur</option>
                <option value="SELATAN">Selatan</option>
                <option value="BARAT">Barat</option>
              </select>
            </div>

            {/* LT */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Luas Tanah (M²)</label>
              <input
                type="text"
                name="luasTanah"
                value={formData.luasTanah}
                pattern="^[0-9]*$"
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* LB */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Luas Bangunan (M²)</label>
              <input
                type="text"
                name="luasBangunan"
                value={formData.luasBangunan}
                pattern="^[0-9]*$"
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Lantai */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Lantai</label>
              <input
                type="text"
                name="lantai"
                pattern="^[0-9]*$"
                value={formData.lantai}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Kamar Tidur */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Kamar Tidur</label>
              <input
                type="text"
                name="kamarTidur"
                pattern="^[0-9]*$"
                value={formData.kamarTidur}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Kamar Mandi */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Kamar Mandi</label>
              <input
                type="text"
                name="kamarMandi"
                pattern="^[0-9]*$"
                value={formData.kamarMandi}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Harga Jual */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Harga Jual</label>
              <input
                type="text"
                name="hargaJual"
                value={formatToRupiah(formData.hargaJual)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>


            {/* Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee</label>
              <input
                type="text"
                name="fee"
                value={formData.fee}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              {/* Legal */}
              <label className="block text-sm font-medium text-gray-700">Legal</label>
              <select
                name="legal"
                value={formData.legal}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Pilih sertifikat</option>
                <option value="SHM">SHM</option>
                <option value="HGB">HGB</option>
                <option value="SHGB">SHGB</option>
                <option value="LAIN_LAIN">Lain Lain</option>
              </select>

              {formData.legal === 'LAIN_LAIN' && (
                <input
                  type="text"
                  name="legalCustom"
                  value={formData.legalCustom || ''}
                  onChange={handleChange}
                  placeholder="Masukkan jenis legal lainnya"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              )}
            </div>
            {/* Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Lain</label>
              <input
                type="text"
                name="lain"
                value={formData.lain}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            {/* Listing */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Listing</label>
              <input
                type="text"
                name="listing"
                value={formData.listing}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-4 w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>

          </form>
        </div>
      </div >
    </div >
  );
};

export default PropertyForm;
