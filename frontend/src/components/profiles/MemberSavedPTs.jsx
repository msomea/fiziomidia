import React, { useEffect, useState } from "react";
import { getProfile, getUserById } from "../../api/profile";
import { getSavedPTsByMember } from "../../api/users";

const MemberSavedPTs = ({ memberId }) => {
  const [savedPTs, setSavedPTs] = useState([]);

  useEffect(() => {
    const fetchSavedPTs = async () => {
      const id = memberId || (await getProfile())._id;
      const data = await getSavedPTsByMember(id);
      setSavedPTs(data || []);
    };
    fetchSavedPTs();
  }, [memberId]);

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Saved Physiotherapists</h2>
      {savedPTs.length ? (
        <ul className="space-y-3">
          {savedPTs.map((pt) => (
            <li key={pt._id} className="border p-2 rounded">
              <p className="text-sm text-gray-700">{pt.name}</p>
              <p className="text-xs text-gray-500">{pt.title}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No saved physiotherapists yet.</p>
      )}
    </section>
  );
};

export default MemberSavedPTs;
