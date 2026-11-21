import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { submitReport } from "../../api/education";
import { REPORT_REASONS } from "../../constants/education";

export default function CopyrightReportModal({ resourceId, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    reason: "",
    explanation: "",
    complainantName: "",
    contactEmail: "",
    evidenceUrl: "",
    declaration: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason) return toast.error(t("edu_report_reason_required"));
    if (!form.explanation.trim()) return toast.error(t("edu_report_explanation_required"));
    if (!form.complainantName.trim()) return toast.error(t("edu_report_name_required"));
    if (!form.contactEmail.trim()) return toast.error(t("edu_report_email_required"));
    if (!form.declaration) return toast.error(t("edu_report_declaration_required"));

    setSubmitting(true);
    try {
      await submitReport(resourceId, {
        reason: form.reason,
        explanation: form.explanation,
        complainantName: form.complainantName,
        contactEmail: form.contactEmail,
        evidenceUrl: form.evidenceUrl || undefined,
        declaration: true,
      });
      toast.success(t("edu_report_success"));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || t("edu_report_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-caribbean mb-4">{t("edu_report_title")}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label"><span className="label-text font-medium">{t("edu_report_reason")}</span></label>
            <select className="select select-bordered w-full" value={form.reason} onChange={set("reason")} required>
              <option value="">{t("edu_select_reason")}</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{t(r.labelKey)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label"><span className="label-text font-medium">{t("edu_report_explanation")}</span></label>
            <textarea className="textarea textarea-bordered w-full" rows={4} value={form.explanation} onChange={set("explanation")} maxLength={5000} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label"><span className="label-text font-medium">{t("edu_report_name")}</span></label>
              <input type="text" className="input input-bordered w-full" value={form.complainantName} onChange={set("complainantName")} required />
            </div>
            <div>
              <label className="label"><span className="label-text font-medium">{t("edu_report_email")}</span></label>
              <input type="email" className="input input-bordered w-full" value={form.contactEmail} onChange={set("contactEmail")} required />
            </div>
          </div>
          <div>
            <label className="label"><span className="label-text font-medium">{t("edu_report_evidence_url")}</span></label>
            <input type="url" className="input input-bordered w-full" value={form.evidenceUrl} onChange={set("evidenceUrl")} placeholder="https://" />
          </div>
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input type="checkbox" className="checkbox checkbox-primary" checked={form.declaration} onChange={set("declaration")} />
              <span className="label-text text-sm">{t("edu_report_declaration")}</span>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t("cancel")}</button>
            <button type="submit" className="btn bg-caribbean text-white border-none hover:bg-tufts" disabled={submitting}>
              {submitting ? t("edu_report_submitting") : t("edu_report_submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
