import React, { useEffect, useState } from "react";
import { getProfile, getUserById } from "../../api/profile";

const MemberDetails = ({ memberId, formData, setFormData }) => {
  const [details, setDetails] = useState({});

  useEffect(() => {
    const fetchDetails = async () => {
      const data = memberId ? await getUserById(memberId) : await getProfile();
      setDetails(data.user || data);
    };
    fetchDetails();
  }, [memberId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails({ ...details, [name]: value });
    setFormData?.({ ...formData, [name]: value });
  };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Member Details</h2>
      {setFormData ? (
        <div className="space-y-3">
          <input
            type="text"
            name="name"
            value={details.name || ""}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
          <input
            type="email"
            name="email"
            value={details.email || ""}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            name="location"
            value={details.location || ""}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>
      ) : (
        <div className="space-y-2 text-gray-700">
          <p>Name: {details.name}</p>
          <p>Email: {details.email}</p>
          <p>Location: {details.location}</p>
        </div>
      )}
    </section>
  );
};

export default MemberDetails;
