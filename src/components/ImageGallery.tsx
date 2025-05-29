import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageGalleryProps {
  media: string[]; // Supports both images and video URLs
}

const isVideo = (url: string) => {
  return /\.(mp4|webm|ogg)$/i.test(url);
};

const ImageGallery: React.FC<ImageGalleryProps> = ({ media }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? media.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === media.length - 1 ? 0 : prevIndex + 1));
  };

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Default media if none are provided
  if (media.length === 0) {
    media = ['https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60'];
  }

  return (
    <>
      <div className="relative flex w-full my-6 mx-auto mt-0 md:mt-6 mb-4 md:mb-8 flex-col md:flex-row gap-0.5 md:gap-6 md:max-w-[1140px]">
        <div className="w-full z-[11] md:z-auto md:relative md:rounded-2xl md:flex-grow md:h-[460px] md:bg-none md:w-auto md:shadow-[0_0_2px_rgba(40,41,61,0.04),_0_4px_8px_rgba(96,97,112,0.16)] mb-[-4px]">
          {isVideo(media[currentIndex]) ? (
            <video
              src={media[currentIndex]}
              controls
              className="max-w-full aspect-[3/2] object-cover max-h-[217px] md:h-full md:w-full md:max-h-none md:aspect-auto md:rounded-2xl cursor-pointer"
              onClick={() => openModal(currentIndex)}
            />
          ) : (
            <img
              src={media[currentIndex]}
              alt={`Property media ${currentIndex + 1}`}
              className="max-w-full aspect-[3/2] object-cover max-h-[217px] md:h-full md:w-full md:max-h-none md:aspect-auto md:rounded-2xl cursor-pointer"
              onClick={() => openModal(currentIndex)}
            />
          )}
          {media.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 text-white hover:bg-opacity-50 rounded-full p-2"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 text-white hover:bg-opacity-50 rounded-full p-2"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

        </div>

        {/* Thumbnails */}
        {media.length > 1 && (
          <div
            className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
            style={{
              maxHeight: '460px',
            }}
          >
            {media.map((item, index) => (
              <div
                key={index}
                className={`w-[200px] h-[80px] md:w-[200px] md:h-[100px] flex-shrink-0 overflow-hidden cursor-pointer relative rounded-lg ${index === currentIndex ? 'ring-2 ring-blue-600' : ''
                  }`}
                onClick={() => setCurrentIndex(index)}
              >
                {isVideo(item) ? (
                  <video src={item} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <button
            className="absolute top-4 right-4 bg-white p-2 rounded-full text-black hover:bg-gray-100 z-50"
            onClick={closeModal}
          >
            <X className="h-6 w-6" />
          </button>

          {isVideo(media[currentIndex]) ? (
            <video
              src={media[currentIndex]}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <img
              src={media[currentIndex]}
              alt={`Modal media ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;
