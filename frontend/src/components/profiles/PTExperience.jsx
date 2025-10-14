import React, { useEffect, useState } from "react";
import { getProfile, getUserById } from "../../api/profile";

const PTExperience = ({ ptId, formData, setFormData }) => {
  const [experience, setExperience] = useState("");

  useEffect(() => {
    if (formData?.experience) setExperience(formData.experience);
    else {
      const fetchProfile = async () => {
        const data = ptId ? await getUserById(ptId) : await getProfile();
        setExperience(data.user?.experience || data.experience || "");
      };
      fetchProfile();
    }
  }, [ptId, formData]);

  const handleChange = (e) => {
    setExperience(e.target.value);
    setFormData?.({ ...formData, experience: e.target.value });
  };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Experience</h2>
      {setFormData ? (
        <textarea
          value={experience}
          onChange={handleChange}
          className="textarea textarea-bordered w-full h-24"
        />
      ) : (
        <p>{experience}</p>
      )}
    </section>
  );
};

export default PTExperience;
