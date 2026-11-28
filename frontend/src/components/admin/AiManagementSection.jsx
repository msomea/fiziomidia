import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { RefreshCw, Upload, Bot, CalendarClock } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import {
  getAIStatus,
  getAIConfig,
  updateAIConfig,
  listKnowledgeDocuments,
  updateKnowledgeDocument,
  uploadKnowledgeDocument,
} from "../../api/ai";
import { DAYS, parseSchedule, buildCron } from "./aiSchedule";

const SPECIALTIES = [
  "musculoskeletal",
  "neurological",
  "cardiorespiratory",
  "pediatric",
  "geriatric",
  "womens-health",
  "exercise-activity",
  "community-rehab",
  "general",
];

const DOC_TYPES = [
  "guideline",
  "systematic-review",
  "patient-guide",
  "research",
  "original",
  "leaflet",
  "policy",
];

const EMPTY_FORM = {
  documentId: "",
  title: "",
  specialty: "musculoskeletal",
  language: "en",
  documentType: "patient-guide",
  conditionTags: "",
  sourceOrganization: "",
  licence: "To be verified",
  file: null,
};

const statusBadge = (status) => {
  const map = {
    approved: "badge-success",
    discovered: "badge-warning",
    restricted: "badge-error",
    rejected: "badge-error",
    under_review: "badge-info",
    pending_licence_review: "badge-info",
    pending_clinical_review: "badge-info",
    pending_language_review: "badge-info",
    superseded: "badge-ghost",
  };
  return map[status] || "badge-ghost";
};

export default function AiManagementSection() {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [reportEnabled, setReportEnabled] = useState(false);
  const [reportDay, setReportDay] = useState("daily");
  const [reportTime, setReportTime] = useState("07:00");
  const [savingReport, setSavingReport] = useState(false);
  const [togglingAgent, setTogglingAgent] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [st, docRes, cfg] = await Promise.all([
        getAIStatus(),
        listKnowledgeDocuments({ limit: 100 }),
        getAIConfig(),
      ]);
      setStatus(st);
      setDocs(docRes.items || []);
      setAdminEmail(cfg?.config?.adminEmail || "");
      const vaCfg = cfg?.config?.agents?.find((a) => a.name === "virtualAdmin");
      const parsed = parseSchedule(vaCfg?.schedule);
      setReportEnabled(Boolean(vaCfg?.schedule));
      setReportDay(parsed.day);
      setReportTime(parsed.time);
    } catch (err) {
      console.error("AI management load failed:", err);
      toast.error(err?.response?.data?.error || "Failed to load AI data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) {
      toast.error("Please choose a file");
      return;
    }
    if (!form.documentId || !form.title || !form.sourceOrganization) {
      toast.error("Document ID, title and source organization are required");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", form.file);
      fd.append("documentId", form.documentId);
      fd.append("title", form.title);
      fd.append("specialty", form.specialty);
      fd.append("language", form.language);
      fd.append("documentType", form.documentType);
      fd.append("conditionTags", form.conditionTags);
      fd.append("sourceOrganization", form.sourceOrganization);
      fd.append("licence", form.licence);
      const res = await uploadKnowledgeDocument(fd);
      toast.success(
        `${t("ai_upload_success")} (${res.chunkCount} chunks)`,
      );
      setForm(EMPTY_FORM);
      setShowUpload(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveAdminEmail = async () => {
    setSavingEmail(true);
    try {
      await updateAIConfig({ adminEmail: adminEmail.trim() || null });
      toast.success(t("ai_email_saved"));
    } catch (err) {
      toast.error(err?.response?.data?.error || "Save failed");
    } finally {
      setSavingEmail(false);
    }
  };

  const saveReportSchedule = async () => {
    setSavingReport(true);
    try {
      await updateAIConfig({
        agents: [
          {
            name: "virtualAdmin",
            schedule: reportEnabled ? buildCron(reportDay, reportTime) : null,
          },
        ],
      });
      toast.success(t("ai_schedule_saved"));
      toast(t("ai_schedule_restart_note"), { icon: "ℹ️" });
    } catch (err) {
      toast.error(err?.response?.data?.error || t("ai_save_error"));
    } finally {
      setSavingReport(false);
    }
  };

  const toggleAgent = async (name, enabled) => {
    setTogglingAgent(name);
    try {
      await updateAIConfig({ agents: [{ name, enabled }] });
      toast.success(t("ai_agent_toggled"));
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Update failed");
    } finally {
      setTogglingAgent(null);
    }
  };

  const setApproval = async (doc, patch) => {
    try {
      await updateKnowledgeDocument(doc._id, patch);
      toast.success("Document updated");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Update failed");
    }
  };

  const agents = status?.agents || {};

  return (
    <CollapsibleSection title={t("ai_section_title")}>
      <div className="flex justify-end mb-3">
        <button onClick={load} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Agent status cards */}
      <h3 className="text-sm font-semibold text-caribbean mb-2 flex items-center gap-1">
        <Bot size={16} /> {t("ai_agents_status")}
      </h3>
      {loading && !status ? (
        <SectionSkeleton count={1} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          {Object.entries(agents).map(([name, a]) => (
            <div key={name} className="bg-alice rounded-lg p-3">
              <p className="text-xs font-semibold text-caribbean capitalize">
                {name.replace(/-/g, " ")}
              </p>
              <p className="text-[11px] text-gray-500">
                {t("ai_model")}: {a.model}
              </p>
              <p className="text-[11px] text-gray-500">
                {t("ai_requests_today")}: {a.used ?? 0}/{a.cap ?? "—"}
              </p>
              <label className="flex items-center gap-1.5 mt-2 text-[11px] text-tufts cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={Boolean(a.enabled)}
                  disabled={togglingAgent === name}
                  onChange={(e) => toggleAgent(name, e.target.checked)}
                />
                {a.enabled ? t("ai_enabled") : t("ai_disabled")}
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Review notification emails */}
      <div className="border border-gray-200 rounded-xl p-3 mb-4 bg-alice">
        <h3 className="text-sm font-semibold text-caribbean mb-1">
          {t("ai_review_emails_title")}
        </h3>
        <p className="text-[11px] text-gray-500 mb-2">{t("ai_review_emails_hint")}</p>
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered input-xs flex-1"
            placeholder="admin@fiziomidia.org, reviewer@example.com"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
          <button
            onClick={saveAdminEmail}
            className="btn btn-xs bg-caribbean hover:bg-tufts text-white"
            disabled={savingEmail}
          >
            {savingEmail ? t("ai_saving") : t("ai_save")}
          </button>
        </div>
      </div>

      {/* Daily report schedule (Virtual Administrator) */}
      <div className="border border-gray-200 rounded-xl p-3 mb-4 bg-alice">
        <h3 className="text-sm font-semibold text-caribbean mb-1 flex items-center gap-1">
          <CalendarClock size={15} /> {t("ai_report_schedule_title")}
        </h3>
        <p className="text-[11px] text-gray-500 mb-2">{t("ai_report_schedule_hint")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-tufts">
            <input
              type="checkbox"
              checked={reportEnabled}
              onChange={(e) => setReportEnabled(e.target.checked)}
            />
            {t("ai_schedule_enabled")}
          </label>
          <label className="text-sm text-tufts">
            {t("ai_schedule_day")}
            <select
              className="select select-bordered select-sm ml-2"
              value={reportDay}
              onChange={(e) => setReportDay(e.target.value)}
              disabled={!reportEnabled}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {t(d.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-tufts">
            {t("ai_schedule_time")}
            <input
              type="time"
              className="input input-bordered input-sm ml-2"
              value={reportTime}
              onChange={(e) => setReportTime(e.target.value)}
              disabled={!reportEnabled}
            />
          </label>
          <button
            onClick={saveReportSchedule}
            className="btn btn-xs btn-outline border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
            disabled={savingReport}
          >
            {savingReport ? t("ai_saving") : t("ai_save_schedule")}
          </button>
        </div>
      </div>

      {/* Upload form */}
      <div className="mb-4">
        <button
          onClick={() => setShowUpload((s) => !s)}
          className="btn btn-xs btn-outline border-caribbean text-caribbean"
        >
          <Upload size={14} className="mr-1" /> {t("ai_upload_doc")}
        </button>

        {showUpload && (
          <form
            onSubmit={handleUpload}
            className="mt-3 border border-gray-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-2"
          >
            <input
              type="file"
              accept=".pdf,.txt,.md,.markdown"
              className="file-input file-input-bordered file-input-xs col-span-full"
              onChange={(e) =>
                setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))
              }
            />
            <input
              className="input input-bordered input-xs"
              placeholder={t("ai_document_id")}
              value={form.documentId}
              onChange={set("documentId")}
              required
            />
            <input
              className="input input-bordered input-xs"
              placeholder={t("ai_title")}
              value={form.title}
              onChange={set("title")}
              required
            />
            <select
              className="select select-bordered select-xs"
              value={form.specialty}
              onChange={set("specialty")}
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="select select-bordered select-xs"
              value={form.language}
              onChange={set("language")}
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
            <select
              className="select select-bordered select-xs"
              value={form.documentType}
              onChange={set("documentType")}
            >
              {DOC_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              className="input input-bordered input-xs"
              placeholder={t("ai_condition_tags")}
              value={form.conditionTags}
              onChange={set("conditionTags")}
            />
            <input
              className="input input-bordered input-xs"
              placeholder={t("ai_source_org")}
              value={form.sourceOrganization}
              onChange={set("sourceOrganization")}
              required
            />
            <input
              className="input input-bordered input-xs"
              placeholder={t("ai_licence")}
              value={form.licence}
              onChange={set("licence")}
            />
            <div className="col-span-full flex justify-end">
              <button
                type="submit"
                className="btn btn-xs bg-caribbean hover:bg-tufts"
                disabled={uploading}
              >
                {uploading ? t("ai_uploading") : t("ai_upload")}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Documents table */}
      <h3 className="text-sm font-semibold text-caribbean mb-2">
        {t("ai_documents")}
      </h3>
      <div className="border border-gray-200 rounded-xl max-h-[400px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-caribbean text-left">
            <tr>
              <th className="p-2">{t("ai_title")}</th>
              <th className="p-2">{t("ai_document_id")}</th>
              <th className="p-2">{t("ai_col_specialty")}</th>
              <th className="p-2">{t("ai_col_lang")}</th>
              <th className="p-2">{t("ai_col_chunks")}</th>
              <th className="p-2">{t("ai_col_status")}</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody className="text-tufts">
            {loading ? (
              <tr>
                <td className="p-0" colSpan="7">
                  <SectionSkeleton count={3} />
                </td>
              </tr>
            ) : docs.length === 0 ? (
              <tr>
                <td className="p-4 text-center text-sm text-gray-500" colSpan="7">
                  {t("ai_no_documents")}
                </td>
              </tr>
            ) : (
              docs.map((d) => (
                <tr key={d._id} className="border-t">
                  <td className="p-2 max-w-[220px] truncate" title={d.title}>
                    {d.title}
                  </td>
                  <td className="p-2 text-xs">{d.documentId}</td>
                  <td className="p-2 text-xs">{d.specialty}</td>
                  <td className="p-2 text-xs uppercase">{d.language}</td>
                  <td className="p-2 text-xs">{d.chunkCount}</td>
                  <td className="p-2">
                    <span className={`badge badge-xs ${statusBadge(d.status)}`}>
                      {d.status}
                    </span>
                    {d.approvedForAI && (
                      <span className="badge badge-xs badge-success ml-1">AI</span>
                    )}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {d.status !== "approved" ? (
                      <button
                        className="btn btn-xs btn-success btn-outline"
                        onClick={() =>
                          setApproval(d, { status: "approved", approvedForAI: true })
                        }
                      >
                        {t("ai_approve")}
                      </button>
                    ) : (
                      <button
                        className="btn btn-xs btn-error btn-outline"
                        onClick={() =>
                          setApproval(d, { status: "restricted", approvedForAI: false })
                        }
                      >
                        {t("ai_restrict")}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
