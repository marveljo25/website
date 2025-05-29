import React, { useState } from 'react';
import { Upload, Check, AlertCircle, X } from 'lucide-react';

interface PictureVideoUploaderProps {
  onUploadComplete: (urls: string[]) => void;
}

const PictureVideoUploader: React.FC<PictureVideoUploaderProps> = ({ onUploadComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const MAX_SIZE_MB = 10;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const validFiles = newFiles.filter((file) => {
        const isValid = file.size / 1024 / 1024 <= MAX_SIZE_MB;
        if (!isValid) {
          setError(`File ${file.name} melebihi ukuran maksimal ${MAX_SIZE_MB}MB.`);
        }
        return isValid;
      });

      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadToCloudinary = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError('');
    setStatusMessage('Mengunggah ke Cloudinary...');

    try {
      const urls: string[] = [];

      for (const file of files) {
        const base64 = await fileToBase64(file);

        const res = await fetch('/.netlify/functions/cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload',
            file: base64,
          }),
        });

        if (!res.ok) throw new Error('Upload gagal');

        const data = await res.json();
        urls.push(data.secure_url);
      }

      setUploadStatus('success');
      setStatusMessage('Semua file berhasil diunggah ke Cloudinary');
      onUploadComplete(urls);
    } catch (err) {
      console.error('Error uploading:', err);
      setError('Gagal mengunggah ke Cloudinary');
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6 m-2">
      <h2 className="text-xl font-semibold mb-4">Upload Gambar/Video Properti</h2>
      <div className="mb-6">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="media-file"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Klik untuk unggah</span> atau drag and drop
              </p>
              <p className="text-xs text-gray-500">Gambar atau video (bisa banyak)</p>
            </div>
            <input
              id="media-file"
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-600"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploadStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error || statusMessage}</span>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-start">
          <Check className="w-5 h-5 mr-2" />
          <span>{statusMessage}</span>
        </div>
      )}

      {loading && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">{statusMessage}</p>
        </div>
      )}

      <button
        onClick={uploadToCloudinary}
        disabled={files.length === 0 || loading}
        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {loading ? 'Mengunggah...' : `Unggah ${files.length} File`}
      </button>
    </div>
  );
};

export default PictureVideoUploader;
