import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const CSVUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
      setStatusMessage('');
    }
  };

  const processCSVData = (data: any[]) => {
    return data.map((row) => ({
      kode: Number(row['KODE']) || 0,
      wilayah: row['WILAYAH'] || '',
      type: row['TYPE'] || '',
      status: row['STATUS'] || '',
      tanggal: row['TANGGAL LISTING'] || '',
      lantai: parseFloat(row['Lantai']) || 1,
      cluster: row['CLUSTER'] ?? '',
      hadap: row['HADAP'] ?? '',
      kamar: Number(row['KT']) || 0,
      luasTanah: Number(row['LT']) || 0,
      luasBangunan: Number(row['LB']) || 0,
      lain: row['Lain-Lain'] ?? '',
      legal: row['LEGAL'] || '',
      hargaJual: (() => {
        const rawPrice = (row['H. JUAL'] || '').trim();
        const cleanedPrice = rawPrice.replace(/,/g, '');
        return !isNaN(Number(cleanedPrice)) ? Number(cleanedPrice) : 0;
      })(),
      fee: row['FEE'] || 0,
      listing: row['LISTING'] || '',
      judul: '',
      description: ''
    }));
  };


  const handleUpload = () => {
    if (!file) {
      setUploadStatus('error');
      setStatusMessage('Silakan pilih file CSV terlebih dahulu');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage('Menganalisis file CSV...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const nonEmptyRows = (results.data as Array<Record<string, any>>).filter(row =>
            Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '')
          );

          const cleanedData = processCSVData(nonEmptyRows);

          if (cleanedData.length === 0) {
            throw new Error('File CSV kosong');
          }
          setStatusMessage(`Mengunggah ${cleanedData.length} properti...`);
          let successCount = 0;
          for (let i = 0; i < cleanedData.length; i++) {
            await addDoc(collection(db, 'properties'), cleanedData[i]);
            successCount++;
            const progress = Math.round(((i + 1) / cleanedData.length) * 100);
            setUploadProgress(progress);
          }
          setUploadStatus('success');
          setStatusMessage(`Berhasil mengunggah ${successCount} properti`);
        } catch (error) {
          console.error('Error mengunggah properti:', error);
          setUploadStatus('error');
          setStatusMessage(`Error: ${(error as Error).message}`);
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setIsUploading(false);
        setUploadStatus('error');
        setStatusMessage(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Import Data Properti dari CSV</h2>

      <div className="mb-6">
        <p className="text-gray-600 mb-2">
          Unggah file CSV dengan data properti. File harus memiliki kolom: NO, KODE, WILAYAH, TYPE, STATUS, dll.
        </p>
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="csv-file"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Klik untuk unggah</span> atau drag and drop
              </p>
              <p className="text-xs text-gray-500">File CSV saja</p>
            </div>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            File terpilih: {file.name}
          </p>
        )}
      </div>

      {uploadStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-start">
          <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {isUploading && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">{statusMessage}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Mengunggah...' : 'Unggah dan Import'}
      </button>
    </div>
  );
};

export default CSVUploader;