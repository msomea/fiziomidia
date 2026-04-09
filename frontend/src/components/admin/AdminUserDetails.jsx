import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { X, Loader2 } from "lucide-react";
import { getAdminUserById, updateUserRole, updateUserLicense } from "../../api/admin";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function AdminUserDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [notes, setNotes] = useState([]);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingLicense, setUpdatingLicense] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await getAdminUserById(id);
      setUser(data.user);
      setNewRole(data.user.role);
    } catch (err) {
      toast.error(t("failed_load_user"));
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async () => {
    try {
      setUpdatingRole(true);
      await updateUserRole(id, { role: newRole });
      toast.success(t("role_updated"));
      loadUser();
    } catch (err) {
      console.error("Role update failed:", err);
      toast.error(t("failed_update_role"));
    } finally {
      setUpdatingRole(false);
    }
  };

  const verifyLicense = async (status, idx) => {
    try {
      setUpdatingLicense(true);

      const response = await updateUserLicense(id, {
        status,
        notes: notes[idx] || "",
        index: idx,
      });

      setUser(response.user);

      toast.success(
        status === "approved"
          ? t("license_approved")
          : t("license_rejected")
      );
    } catch (err) {
      console.error("License verification failed:", err);
      toast.error(t("failed_update_license"));
    } finally {
      setUpdatingLicense(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t("loading_user")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 mt-20 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-caribbean">{t("user_details")}</h2>

      <div className="mt-4 space-y-6">

        {/* Basic Info */}
        <div className="border p-4 rounded text-tufts">
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold text-caribbean">{t("basic_info")}</h3>
            <button onClick={() => navigate(-1)}>
              <X className="text-red-400 hover:text-red-800" />
            </button>
          </div>

          <p>{t("id_label")}: {user._id}</p>
          <p>{t("name_label")}: {user.fullName}</p>
          <p>{t("email_label")}: {user.email}</p>
          <p>{t("phone_label")}: {user.phone}</p>

          {/* Role Change */}
          <div className="mt-4">
            <label className="block font-medium mb-1">{t("role_label")}</label>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="member">{t("role_member")}</option>
                <option value="pendingPhysiotherapist">{t("role_pending_pt")}</option>
                <option value="physiotherapist">{t("role_physio")}</option>
                <option value="admin">{t("role_admin")}</option>
              </select>

              <button
                onClick={updateRole}
                disabled={updatingRole}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {updatingRole ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("updating")}
                  </span>
                ) : (
                  t("update_role")
                )}
              </button>
            </div>
          </div>
        </div>

        {/* PT Licenses */}
        {user.ptProfile?.licenses?.map((license, idx) => (
          <div key={license._id} className="border p-4 rounded text-tufts">
            <h3 className="font-semibold text-lg text-caribbean">{t("license_verification")}</h3>

            <p>{t("license_number")}: {license.licenseNumber}</p>
            <p>{t("status_label")}: {license.verificationStatus}</p>

            <a
              href={license.licenseFileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              {t("view_uploaded_license")}
            </a>

            <textarea
              placeholder={t("verification_notes")}
              className="w-full border p-2 rounded mt-3"
              value={notes[idx] || ""}
              onChange={(e) => {
                const newNotes = [...notes];
                newNotes[idx] = e.target.value;
                setNotes(newNotes);
              }}
            />

            <div className="flex flex-wrap gap-3 mt-3">
              <button
                disabled={updatingLicense}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                onClick={() => verifyLicense("approved", idx)}
              >
                {updatingLicense ? t("updating") : t("approve")}
              </button>

              <button
                disabled={updatingLicense}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                onClick={() => verifyLicense("rejected", idx)}
              >
                {t("reject")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
