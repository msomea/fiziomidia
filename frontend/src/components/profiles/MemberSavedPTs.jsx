import React from "react";

const MemberSavedPTs = () => {
  const saved = [
    {
      name: "Dr. Jane Mwita",
      specialty: "Orthopedic Rehabilitation",
      img: "/images/pt_avatar.jpg",
    },
    {
      name: "Dr. Kelvin Nyalusi",
      specialty: "Sports Injury Recovery",
      img: "/images/pt2.jpg",
    },
  ];

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">
        Saved Physiotherapists
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {saved.map((pt, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border rounded-lg p-3 hover:shadow-md transition"
          >
            <img
              src={pt.img}
              alt={pt.name}
              className="w-14 h-14 rounded-full object-cover border"
            />
            <div>
              <h3 className="font-medium text-black">{pt.name}</h3>
              <p className="text-sm text-gray-600">{pt.specialty}</p>
              <button className="mt-1 text-caribbean text-xs font-medium hover:underline">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MemberSavedPTs;
