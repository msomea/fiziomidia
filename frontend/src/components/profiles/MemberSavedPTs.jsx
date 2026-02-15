import React, { useState, useRef } from "react";
import { Link } from "react-router";
import { Heart, Trash2 } from "lucide-react";
import { toggleSavePT } from "../../api/users";
import toast from "react-hot-toast";
import avatarFallback from "../../assets/avatar.jpg";

const MemberSavedPTs = ({ savedPTs = [] }) => {
  const [pts, setPts] = useState(savedPTs);
  const pendingDelete = useRef(null);

  const handleRemove = (pt) => {
    // Optimistically remove
    setPts((prev) => prev.filter((p) => p._id !== pt._id));

    // Clear any previous timer
    if (pendingDelete.current) {
      clearTimeout(pendingDelete.current.timer);
    }

    const toastId = toast(
      (t) => (
        <div className="flex items-center justify-between gap-4">
          <span>Removed from saved</span>
          <button
            onClick={() => {
              // Undo action
              setPts((prev) => [pt, ...prev]);
              clearTimeout(pendingDelete.current?.timer);
              toast.dismiss(t.id);
            }}
            className="text-caribbean font-semibold hover:underline"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    // Delay backend call
    const timer = setTimeout(async () => {
      try {
        await toggleSavePT(pt._id);
      } catch (err) {
        toast.error("Failed to remove PT");
        // Restore if backend fails
        setPts((prev) => [pt, ...prev]);
      }
    }, 5000);

    pendingDelete.current = { timer, ptId: pt._id };
  };

  return (
    <section className="bg-white shadow-sm rounded-3xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Heart className="text-red-500" size={20} />
          Saved Physiotherapists
        </h2>
        <span className="text-sm text-gray-500">
          {pts.length} saved
        </span>
      </div>

      {pts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {pts.map((pt) => (
            <div
              key={pt._id}
              className="group bg-gray-50 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <img
                  src={pt.profileImageUrl || avatarFallback}
                  alt={pt.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = avatarFallback;
                  }}
                />

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {pt.fullName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {pt.ptProfile?.speciality?.join(", ") || "Physiotherapist"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <Link
                  to={`/profile/pt/${pt._id}`}
                  className="text-sm font-medium text-caribbean hover:underline"
                >
                  View Profile →
                </Link>

                <button
                  onClick={() => handleRemove(pt)}
                  className="flex items-center gap-1 text-red-500 text-sm hover:text-red-600 transition"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-10 text-center border border-dashed border-gray-200">
          <Heart className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600 font-medium">
            You haven’t saved any physiotherapists yet.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Browse profiles and save your preferred PTs.
          </p>
        </div>
      )}
    </section>
  );
};

export default MemberSavedPTs;
