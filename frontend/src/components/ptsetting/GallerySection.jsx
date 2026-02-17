import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ASSET_URL } from "../../config/constants";

const GallerySection = ({ formData, setFormData }) => {
  const { t } = useTranslation();
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

    setFormData((prev) => ({
      ...prev,
      gallery: [...(prev.gallery || []), ...files],
    }));
  };

  const handleCaptionChange = (index, value) => {
    setFormData((prev) => {
      const updatedGallery = [...(prev.gallery || [])];
      updatedGallery[index] = { ...updatedGallery[index], caption: value };
      return { ...prev, gallery: updatedGallery };
    });
  };

  const removeImage = (index) => {
    setFormData((prev) => {
      const updatedGallery = [...(prev.gallery || [])];
      updatedGallery.splice(index, 1);
      return { ...prev, gallery: updatedGallery };
    });
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">{t("gallery")}</h2>
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
                    alt={`${t("gallery_image_alt")} ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <input
                    type="text"
                    placeholder={t("caption")}
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
