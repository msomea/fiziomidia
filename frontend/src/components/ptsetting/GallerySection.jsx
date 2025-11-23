import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";

const GallerySection = ({ formData, setFormData }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Generate previews from formData.gallery
  const previews = (formData.gallery || []).map((item) => {
    if (item.file instanceof File) {
      return {
        src: URL.createObjectURL(item.file),
        caption: item.caption || "",
        file: item.file,
      };
    }
    return {
      src: item.imageUrl,
      caption: item.caption || "",
      file: null,
    };
  });

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []).map((file) => ({
      file,
      caption: "",
    }));

    // Update gallery in formData
    setFormData((prev) => ({
      ...prev,
      gallery: [...(prev.gallery || []), ...files],
    }));

  // files are tracked inside formData.gallery; no parent sync needed
  };

  const handleCaptionChange = (index, value) => {
    setFormData((prev) => {
      const updatedGallery = [...(prev.gallery || [])];
      updatedGallery[index] = { ...updatedGallery[index], caption: value };
      return { ...prev, gallery: updatedGallery };
    });

    // captions are stored in formData.gallery so no extra sync required
  };

  const removeImage = (index) => {
    setFormData((prev) => {
      const updatedGallery = [...(prev.gallery || [])];
      updatedGallery.splice(index, 1);
      return { ...prev, gallery: updatedGallery };
    });

    // removed from formData.gallery above; nothing else to do
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
        <div className="mt-4 space-y-4">
          <input
            type="file"
            multiple
            accept="image/*"
            className="file-input file-input-bordered w-full"
            onChange={handleGalleryChange}
          />

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
              {previews.map((p, index) => (
                <div key={index} className="relative border p-1 rounded">
                  <button
                    type="button"
                    className="absolute top-1 right-1 text-red-500"
                    onClick={() => removeImage(index)}
                  >
                    <X size={18} />
                  </button>
                  <img
                    src={p.src}
                    alt={`Gallery ${index}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <input
                    type="text"
                    placeholder="Caption"
                    value={formData.gallery[index]?.caption || ""}
                    onChange={(e) =>
                      handleCaptionChange(index, e.target.value)
                    }
                    className="input input-sm w-full mt-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GallerySection;
