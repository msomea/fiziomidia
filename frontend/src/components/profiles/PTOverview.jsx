import React, { useEffect, useState } from "react";
import { getProfile, getUserById } from "../../api/profile";

const PTOverview = ({ ptId, formData, setFormData }) => {
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (formData?.bio) {
      setBio(formData.bio);
    } else {
      const fetchProfile = async () => {
        const data = ptId ? await getUserById(ptId) : await getProfile();
        setBio(data.user?.bio || data.bio || "");
      };
      fetchProfile();
    }
  }, [ptId, formData]);

  const handleChange = (e) => {
    setBio(e.target.value);
    setFormData?.({ ...formData, bio: e.target.value });
  };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">About</h2>
      {setFormData ? (
        <textarea
          value={bio}
          onChange={handleChange}
          className="textarea textarea-bordered w-full h-32"
        />
      ) : (
        <p className="text-gray-700 leading-relaxed text-sm md:text-base">{bio}</p>
      )}
    </section>
  );
};

export default PTOverview;
