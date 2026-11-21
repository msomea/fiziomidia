import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { EDUCATION_CATEGORIES, EDUCATION_FILE_TYPES, EDUCATION_LANGUAGES } from "../../constants/education";

export default function ResourceFilters({ params, onChange }) {
  const { t } = useTranslation();

  const handle = (key) => (e) => onChange({ [key]: e.target.value || undefined, page: 1 });

  return (
    <div className="bg-white rounded-2xl shadow p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="col-span-2 md:col-span-1 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t("edu_search_placeholder")}
          className="input input-bordered input-sm w-full pl-9"
          value={params.search || ""}
          onChange={(e) => onChange({ search: e.target.value || undefined, page: 1 })}
        />
      </div>

      <select className="select select-bordered select-sm" value={params.category || ""} onChange={handle("category")}>
        <option value="">{t("edu_all_categories")}</option>
        {EDUCATION_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
        ))}
      </select>

      <select className="select select-bordered select-sm" value={params.language || ""} onChange={handle("language")}>
        <option value="">{t("edu_all_languages")}</option>
        {EDUCATION_LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      <select className="select select-bordered select-sm" value={params.fileType || ""} onChange={handle("fileType")}>
        <option value="">{t("edu_all_formats")}</option>
        {EDUCATION_FILE_TYPES.map((f) => (
          <option key={f} value={f}>{f.toUpperCase()}</option>
        ))}
      </select>

      <select className="select select-bordered select-sm" value={params.sort || "newest"} onChange={handle("sort")}>
        <option value="newest">{t("edu_sort_newest")}</option>
        <option value="title">{t("edu_sort_title")}</option>
        <option value="downloads">{t("edu_sort_downloads")}</option>
      </select>
    </div>
  );
}
