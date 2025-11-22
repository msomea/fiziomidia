import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const GallerySection = ({ formData, setFormData }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      gallery: [...(prev.gallery || []), ...files],
    }));
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">Gallery</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4">
          <input
            type="file"
            multiple
            className="file-input file-input-bordered w-full"
            onChange={handleGalleryChange}
          />
          {formData.gallery?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.gallery.map((file) => (
                <span key={file.name || file.url} className="badge badge-outline">
                  {file.name || file.url}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GallerySection;
