import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { EDUCATION_CATEGORIES, EDUCATION_FILE_TYPES, EDUCATION_LANGUAGES } from "../../constants/education";
import { createRequest } from "../../api/education";

export default function ResourceRequestForm({ onCreated }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    preferredFormat: "",
    language: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error(t("edu_request_title_required"));
    if (!form.category) return toast.error(t("edu_request_category_required"));

    setSubmitting(true);
    try {
      await createRequest({
        title: form.title,
        description: form.description,
        category: form.category,
        preferredFormat: form.preferredFormat || undefined,
        language: form.language || undefined,
      });
      toast.success(t("edu_request_success"));
      setForm({ title: "", description: "", category: "", preferredFormat: "", language: "" });
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_request_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div>
        <label className="label"><span className="label-text font-medium">{t("edu_request_title")}</span></label>
        <input type="text" className="input input-bordered w-full" value={form.title} onChange={set("title")} maxLength={200} required />
      </div>
      <div>
        <label className="label"><span className="label-text font-medium">{t("edu_request_description")}</span></label>
        <textarea className="textarea textarea-bordered w-full" rows={3} value={form.description} onChange={set("description")} maxLength={2000} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="label"><span className="label-text font-medium">{t("edu_upload_category")}</span></label>
          <select className="select select-bordered w-full" value={form.category} onChange={set("category")} required>
            <option value="">{t("edu_select_category")}</option>
            {EDUCATION_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label"><span className="label-text font-medium">{t("edu_request_preferred_format")}</span></label>
          <select className="select select-bordered w-full" value={form.preferredFormat} onChange={set("preferredFormat")}>
            <option value="">{t("edu_any_format")}</option>
            {EDUCATION_FILE_TYPES.map((f) => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label"><span className="label-text font-medium">{t("edu_upload_language")}</span></label>
          <select className="select select-bordered w-full" value={form.language} onChange={set("language")}>
            <option value="">{t("edu_any_language")}</option>
            {EDUCATION_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-500">{t("edu_request_disclaimer")}</p>
      <div className="flex justify-end">
        <button type="submit" className="btn bg-caribbean text-white border-none hover:bg-tufts" disabled={submitting}>
          {submitting ? t("edu_request_submitting") : t("edu_request_submit")}
        </button>
      </div>
    </form>
  );
}
