import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Upload, X } from "lucide-react";
import { uploadResource } from "../../api/education";
import {
  EDUCATION_SUBCATEGORIES,
  EDUCATION_LANGUAGES,
  EDUCATION_LICENSE_TYPES,
  MAX_FILE_SIZE_MB,
  ACCEPTED_FILE_TYPES,
  getSortedCategories,
} from "../../constants/education";

export default function ResourceUploadForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    language: "en",
    licenseType: "",
    licenseUrl: "",
    licenseNotes: "",
    copyrightDeclaration: false,
  });

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    const allowed = ACCEPTED_FILE_TYPES.split(",");
    if (!allowed.includes(ext)) {
      toast.error(t("edu_upload_invalid_type"));
      return;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(t("edu_upload_too_large", { size: MAX_FILE_SIZE_MB }));
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error(t("edu_upload_no_file"));
    if (!form.title.trim()) return toast.error(t("edu_upload_title_required"));
    if (!form.category) return toast.error(t("edu_upload_category_required"));
    if (!form.licenseType) return toast.error(t("edu_upload_license_required"));
    if (!form.copyrightDeclaration) return toast.error(t("edu_upload_declaration_required"));
    if (form.licenseType === "other_authorized" && !form.licenseNotes.trim()) {
      return toast.error(t("edu_upload_license_notes_required"));
    }

    setSubmitting(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== false) fd.append(k, v === true ? "true" : v);
      });

      await uploadResource(fd, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      });

      toast.success(t("edu_upload_success"));
      navigate("/education/my-uploads");
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_upload_failed"));
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  const subOptions = form.category ? EDUCATION_SUBCATEGORIES[form.category] || [] : [];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-5">
      {/* File dropzone */}
      <div>
        <label className="label"><span className="label-text font-medium text-tufts">{t("edu_upload_file")}</span></label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver ? "border-caribbean bg-alice" : "border-gray-300"
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <Upload className="w-5 h-5 text-caribbean" />
              <span className="font-medium text-tufts">{file.name}</span>
              <span className="text-sm text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              <button type="button" onClick={() => setFile(null)} className="btn btn-ghost btn-xs">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">{t("edu_upload_dropzone")}</p>
              <p className="text-xs text-gray-400 mt-1">
                {t("edu_upload_formats", { size: MAX_FILE_SIZE_MB })}
              </p>
              <input
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                id="edu-file-input"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <label htmlFor="edu-file-input" className="btn btn-sm bg-tufts text-white border-none hover:bg-caribbean mt-3">
                {t("edu_upload_choose_file")}
              </label>
            </>
          )}
        </div>
        {submitting && progress > 0 && (
          <progress className="progress progress-primary w-full mt-3" value={progress} max="100" />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label"><span className="label-text font-medium text-tufts">{t("edu_form_title")}</span></label>
          <input type="text" className="input input-bordered w-full" value={form.title} onChange={set("title")} maxLength={200} required />
        </div>
        <div className="md:col-span-2">
          <label className="label"><span className="label-text font-medium text-tufts">{t("edu_upload_description")}</span></label>
          <textarea className="textarea textarea-bordered w-full" rows={3} value={form.description} onChange={set("description")} maxLength={5000} />
        </div>
        <div>
          <label className="label"><span className="label-text font-medium text-tufts">{t("edu_upload_category")}</span></label>
          <select className="select select-bordered w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: "" }))} required>
            <option value="">{t("edu_select_category")}</option>
            {getSortedCategories(t).map((c) => (
              <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
            ))}
          </select>
        </div>
        {subOptions.length > 0 && (
          <div>
            <label className="label"><span className="label-text font-medium text-tufts">{t("edu_upload_subcategory")}</span></label>
            <select className="select select-bordered w-full" value={form.subCategory} onChange={set("subCategory")}>
              <option value="">{t("edu_select_subcategory")}</option>
              {subOptions.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label"><span className="label-text font-medium text-tufts">{t("edu_upload_language")}</span></label>
          <select className="select select-bordered w-full" value={form.language} onChange={set("language")}>
            {EDUCATION_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label"><span className="label-text font-medium text-tufts">{t("edu_upload_license")}</span></label>
          <select className="select select-bordered w-full" value={form.licenseType} onChange={set("licenseType")} required>
            <option value="">{t("edu_select_license")}</option>
            {EDUCATION_LICENSE_TYPES.map((l) => (
              <option key={l.value} value={l.value}>{t(l.labelKey)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label"><span className="label-text font-medium text-tufts">{t("edu_upload_license_url")}</span></label>
          <input type="url" className="input input-bordered w-full" value={form.licenseUrl} onChange={set("licenseUrl")} placeholder="https://" />
        </div>
        <div>
          <label className="label"><span className="label-text font-medium text-tufts">{t("edu_upload_license_notes")}</span></label>
          <input type="text" className="input input-bordered w-full" value={form.licenseNotes} onChange={set("licenseNotes")} maxLength={2000} />
        </div>
      </div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input type="checkbox" className="checkbox checkbox-primary" checked={form.copyrightDeclaration} onChange={set("copyrightDeclaration")} />
          <span className="label-text text-sm text-tufts">{t("edu_upload_declaration")}</span>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/education")}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn bg-caribbean text-white border-none hover:bg-tufts" disabled={submitting}>
          {submitting ? t("edu_upload_submitting") : t("edu_upload_submit")}
        </button>
      </div>
    </form>
  );
}
