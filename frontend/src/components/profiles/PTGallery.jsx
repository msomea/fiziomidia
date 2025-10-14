import React, { useEffect, useState } from "react";
import { getProfile, getUserById } from "../../api/profile";

const PTGallery = ({ ptId, formData, setFormData }) => {
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    if (formData?.gallery) setGallery(formData.gallery);
    else {
      const fetchProfile = async () => {
        const data = ptId ? await getUserById(ptId) : await getProfile();
        setGallery(data.user?.gallery || data.gallery || []);
      };
      fetchProfile();
    }
  }, [ptId, formData]);

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    setGallery(files);
    setFormData?.({ ...formData, gallery: files });
  };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Gallery</h2>
      {setFormData ? (
        <input type="file" multiple onChange={handleChange} className="file-input file-input-bordered w-full" />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((img, i) => (
            <img key={i} src={img.url || URL.createObjectURL(img)} alt="gallery" className="w-full h-24 object-cover rounded" />
          ))}
        </div>
      )}
    </section>
  );
};

export default PTGallery;
