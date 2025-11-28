import React, { useEffect, useState } from "react";
import { getSavedPTsByMember  } from "../../api/users";
import { useAuth } from "../../context/AuthContext";


const MemberSavedPTs = () => {
  const { user } = useAuth(); 
  const [savedPTs, setSavedPTs] = useState([]);

  useEffect(() => {
    const fetchPTs = async () => {
      if (!user?._id) return;
      try {
        const PTs = await getSavedPTsByMember(user._id);
        setSavedPTs(PTs);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
      }
    };
    fetchPTs();
  }, [user]);

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Saved PTs</h2>
      {savedPTs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {savedPTs.map((pt) => (
            <div
              key={pt._id}
              className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-800">{pt.name}</h3>
              <p className="text-gray-600 text-sm">{pt.specialty}</p>
              <p className="text-gray-500 text-sm">{pt.location}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">You haven’t saved any physiotherapists yet.</p>
      )}
    </section>
  );
};

export default MemberSavedPTs;
