import React, { useEffect, useState } from "react";
import { getProfile, getUserById } from "../../api/profile";

const PTServices = ({ ptId, formData, setFormData }) => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (formData?.services) setServices(formData.services);
    else {
      const fetchProfile = async () => {
        const data = ptId ? await getUserById(ptId) : await getProfile();
        setServices(data.user?.services || data.services || []);
      };
      fetchProfile();
    }
  }, [ptId, formData]);

  const handleChange = (e) => {
    const arr = e.target.value.split(",").map((s) => s.trim());
    setServices(arr);
    setFormData?.({ ...formData, services: arr });
  };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Services</h2>
      {setFormData ? (
        <textarea
          value={services.join(", ")}
          onChange={handleChange}
          className="textarea textarea-bordered w-full h-24"
        />
      ) : (
        <ul className="list-disc list-inside space-y-1">
          {services.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default PTServices;
