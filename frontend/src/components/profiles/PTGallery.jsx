import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";


const PTGallery = ({ gallery }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  if (!gallery || gallery.length === 0) return null;

  const recentGallery = gallery.slice(-10).reverse(); // last 10 images, newest first

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-caribbean">{t("gallery")}</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recentGallery.map((item, index) => (
            <div key={index} className="rounded overflow-hidden shadow-sm">
              <img
                src={item.imageUrl}
                alt={item.caption || `Image ${index + 1}`}
                className="w-full h-40 object-cover"
              />
              {item.caption && (
                <p className="text-gray-700 text-sm mt-1 p-2">{item.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PTGallery;
