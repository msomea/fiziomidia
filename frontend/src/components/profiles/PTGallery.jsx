import React from "react";

const PTGallery = () => {
  const images = [
    "/images/gallery1.jpg",
    "/images/gallery2.jpg",
    "/images/gallery3.jpg",
  ];

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Gallery</h2>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Gallery ${i + 1}`}
            className="rounded-lg object-cover w-full h-28 md:h-40"
          />
        ))}
      </div>
    </section>
  );
};

export default PTGallery;
