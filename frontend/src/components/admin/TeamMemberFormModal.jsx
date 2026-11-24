import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  adminCreateTeamMember,
  adminUpdateTeamMember,
} from "../../api/teamMembers";

const emptyForm = {
  name: "",
  title: "",
  email: "",
  bio: "",
  sortOrder: 0,
  isActive: true,
};

export default function TeamMemberFormModal({ member, onClose, onSaved }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name || "",
        title: member.title || "",
        email: member.email || "",
        bio: member.bio || "",
        sortOrder: member.sortOrder ?? 0,
        isActive: member.isActive ?? true,
      });
      setPreview(member.image || "");
    } else {
      setForm(emptyForm);
      setPreview("");
    }
    setImageFile(null);
  }, [member]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.title.trim() || !form.email.trim()) {
      toast.error(t("team_required_fields"));
      return;
    }

    if (!member && !imageFile) {
      toast.error(t("team_image_required"));
      return;
    }

    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      toast.error(t("team_image_size"));
      return;
    }

    const data = new FormData();
    data.append("name", form.name.trim());
    data.append("title", form.title.trim());
    data.append("email", form.email.trim());
    data.append("bio", form.bio.trim());
    data.append("sortOrder", String(form.sortOrder));
    data.append("isActive", String(form.isActive));
    if (imageFile) {
      data.append("teamMemberImage", imageFile);
    }

    try {
      setSubmitting(true);
      const result = member
        ? await adminUpdateTeamMember(member._id, data)
        : await adminCreateTeamMember(data);

      toast.success(member ? t("team_member_updated") : t("team_member_created"));
      onSaved?.(result.member);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || t("team_save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-caribbean mb-4">
          {member ? t("team_edit_member") : t("team_add_member")}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text font-medium text-tufts">
                  {t("team_member_name")}
                </span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text font-medium text-tufts">
                  {t("team_member_title")}
                </span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">
              <span className="label-text font-medium text-tufts">
                {t("team_member_email")}
              </span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input input-bordered w-full"
              required
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-medium text-tufts">
                {t("team_member_bio")}
              </span>
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="textarea textarea-bordered w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="label">
                <span className="label-text font-medium text-tufts">
                  {t("team_sort_order")}
                </span>
              </label>
              <input
                type="number"
                name="sortOrder"
                min="0"
                value={form.sortOrder}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>
            <label className="label cursor-pointer justify-start gap-3 pb-2">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="checkbox checkbox-primary"
              />
              <span className="label-text font-medium text-tufts">
                {t("team_active")}
              </span>
            </label>
          </div>

          <div>
            <label className="label">
              <span className="label-text font-medium text-tufts">
                {t("team_member_photo")}
              </span>
            </label>
            {preview && (
              <img
                src={preview}
                alt={form.name || t("team_member_photo")}
                className="w-24 h-24 rounded-xl object-cover border mb-3"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input file-input-bordered w-full"
            />
            {!member && <p className="text-xs text-gray-500 mt-1">{t("team_photo_required_hint")}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="btn bg-caribbean text-white border-none hover:bg-tufts"
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {member ? t("team_update_member") : t("team_save_member")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
