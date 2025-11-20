import React from "react";

const GallerySection = ({ formData, setFormData }) => {
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      gallery: [...(prev.gallery || []), ...files]
    }));
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-caribbean">Gallery</h2>
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
  );
};

export default GallerySection;
