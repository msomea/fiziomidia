import React, { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { getProfile, getUserById } from "../../api/profile";

const PTAvailability = ({ ptId, formData, setFormData }) => {
  const [availability, setAvailability] = useState("");

  useEffect(() => {
    if (formData?.availability) setAvailability(formData.availability);
    else {
      const fetchProfile = async () => {
        const data = ptId ? await getUserById(ptId) : await getProfile();
        setAvailability(data.user?.availability || data.availability || "");
      };
      fetchProfile();
    }
  }, [ptId, formData]);

  const handleChange = (e) => {
    setAvailability(e.target.value);
    setFormData?.({ ...formData, availability: e.target.value });
  };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Availability</h2>
      {setFormData ? (
        <textarea
          value={availability}
          onChange={handleChange}
          className="textarea textarea-bordered w-full h-24"
        />
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-5 h-5 text-caribbean" />
            <p className="text-sm text-gray-700">{availability}</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-caribbean" />
          </div>
        </div>
      )}
    </section>
  );
};

export default PTAvailability;
