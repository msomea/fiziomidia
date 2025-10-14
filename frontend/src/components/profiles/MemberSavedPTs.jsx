import React, { useEffect, useState } from "react";
import { getSavedPTsByMember } from "../../api/users";

const MemberSavedPTs = () => {
  const [savedPTs, setSavedPTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPTs = async () => {
      try {
        const response = await getSavedPTsByMember();

        // ✅ Normalize the data
        const data = response?.data;
        if (Array.isArray(data)) {
          setSavedPTs(data);
        } else if (Array.isArray(data?.savedPTs)) {
          setSavedPTs(data.savedPTs);
        } else {
          setSavedPTs([]);
          console.warn("Unexpected API response for saved PTs:", data);
        }
      } catch (error) {
        console.error("Error fetching saved PTs:", error);
        setSavedPTs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPTs();
  }, []);

  if (loading) return <p>Loading saved physiotherapists...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Saved Physiotherapists</h2>
      {savedPTs.length === 0 ? (
        <p>No saved physiotherapists found.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedPTs.map((pt) => (
            <li
              key={pt._id}
              className="border rounded-lg p-3 shadow hover:shadow-md transition"
            >
              <h3 className="font-semibold">{pt.name || pt.fullName}</h3>
              <p>{pt.specialty || "Physiotherapist"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemberSavedPTs;
