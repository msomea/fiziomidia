import React, { useState, useRef } from "react";
import { Link } from "react-router";
import { Heart, Trash2 } from "lucide-react";
import { toggleSavePT } from "../../../api/users";
import toast from "react-hot-toast";
import avatarFallback from "../../../assets/avatar.jpg";
import { useTranslation } from "react-i18next";

const MemberSavedPTs = ({ savedPTs = [] }) => {
  const { t } = useTranslation();
  const [pts, setPts] = useState(savedPTs);
  const pendingDelete = useRef(null);

  const handleRemove = (pt) => {
    setPts((prev) => prev.filter((p) => p._id !== pt._id));

    if (pendingDelete.current) clearTimeout(pendingDelete.current.timer);

    const toastId = toast(
      (tToast) => (
        <div className="flex items-center justify-between gap-4">
          <span>{t("removed_from_saved")}</span>
          <button
            onClick={() => {
              setPts((prev) => [pt, ...prev]);
              clearTimeout(pendingDelete.current?.timer);
              toast.dismiss(tToast.id);
            }}
            className="text-caribbean font-semibold hover:underline"
          >
            {t("undo")}
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    const timer = setTimeout(async () => {
      try {
        await toggleSavePT(pt._id);
      } catch (err) {
        toast.error(t("failed_remove_pt"));
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
          {t("saved_physiotherapists")}
        </h2>
        <span className="text-sm text-gray-500">
          {pts.length} {t("saved")}
        </span>
      </div>

      {pts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {pts.map((pt) => (
            <div
              key={pt._id}
              className="group bg-gray-50 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between"
            >
              {/* PT Info */}
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={pt.profileImageUrl || avatarFallback}
                  alt={pt.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = avatarFallback;
                  }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{pt.fullName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {pt.ptProfile?.speciality?.join(", ") || t("physiotherapist")}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 sm:mt-0 flex items-center gap-4">
                <Link
                  to={`/profile/pt/${pt._id}`}
                  className="text-sm font-medium text-caribbean hover:underline"
                >
                  {t("view_profile")} →
                </Link>
                <button
                  onClick={() => handleRemove(pt)}
                  className="flex items-center gap-1 text-red-500 text-sm hover:text-red-600 transition"
                >
                  <Trash2 size={16} />
                  {t("remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-10 text-center border border-dashed border-gray-200">
          <Heart className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600 font-medium">{t("no_saved_pts_yet")}</p>
          <p className="text-sm text-gray-500 mt-1">{t("browse_and_save_pts")}</p>
        </div>
      )}
    </section>
  );
};

export default MemberSavedPTs;
