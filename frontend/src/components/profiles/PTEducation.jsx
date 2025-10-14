import React, { useEffect, useState } from "react";
import { getProfile, getUserById } from "../../api/profile";

const PTEducation = ({ ptId, formData, setFormData }) => {
  const [education, setEducation] = useState([]);

  useEffect(() => {
    if (formData?.education) setEducation(formData.education);
    else {
      const fetchProfile = async () => {
        const data = ptId ? await getUserById(ptId) : await getProfile();
        setEducation(data.user?.education || data.education || []);
      };
      fetchProfile();
    }
  }, [ptId, formData]);

  const handleChange = (e) => {
    const arr = e.target.value.split(";").map((s) => s.trim());
    setEducation(arr);
    setFormData?.({ ...formData, education: arr });
  };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Education</h2>
      {setFormData ? (
        <textarea
          value={education.join("; ")}
          onChange={handleChange}
          className="textarea textarea-bordered w-full h-24"
        />
      ) : (
        <ul className="space-y-2">
          {education.map((edu, i) => (
            <li key={i}>{edu}</li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default PTEducation;
