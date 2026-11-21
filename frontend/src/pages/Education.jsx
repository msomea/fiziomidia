import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Search,
  Upload,
  FileQuestion,
  FolderOpen,
  Folder,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fetchRecentResources } from "../api/education";
import ResourceCard from "../components/education/ResourceCard";
import ResourceSkeleton from "../components/education/ResourceSkeleton";
import { EDUCATION_CATEGORIES } from "../constants/education";

const Education = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user || user.role === "guest";

  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchRecentResources(6);
        setRecent(res.data.resources || []);
      } catch {
        // hub still works if recent resources fail to load
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/education/library?search=${encodeURIComponent(q)}` : "/education/library");
  };

  const actions = [
    {
      icon: FolderOpen,
      title: t("edu_browse_library"),
      desc: t("edu_browse_library_desc"),
      path: "/education/library",
      color: "text-caribbean",
      bg: "bg-alice",
      auth: false,
    },
    {
      icon: Upload,
      title: t("edu_upload_resource"),
      desc: t("edu_upload_resource_desc"),
      path: "/education/upload",
      color: "text-tufts",
      bg: "bg-blue-50",
      auth: true,
    },
    {
      icon: FileQuestion,
      title: t("edu_request_resource"),
      desc: t("edu_request_resource_desc"),
      path: "/education/requests",
      color: "text-caribbean",
      bg: "bg-alice",
      auth: true,
    },
    {
      icon: Folder,
      title: t("edu_my_uploads"),
      desc: t("edu_my_uploads_desc"),
      path: "/education/my-uploads",
      color: "text-tufts",
      bg: "bg-blue-50",
      auth: true,
    },
  ];

  const handleAction = (a) => {
    if (a.auth && isGuest) {
      navigate("/login");
      return;
    }
    navigate(a.path);
  };

  return (
    <div className="min-h-screen bg-alice mt-20">
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#E0F7FA] to-[#D0F0F7] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <BookOpen className="w-12 h-12 text-caribbean mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-caribbean">
            {t("edu_hub_title")}
          </h1>
          <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
            {t("edu_hub_desc")}
          </p>

          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("edu_hub_search_placeholder")}
                className="input input-bordered w-full pl-12 pr-4 py-3 rounded-full shadow-sm"
              />
            </div>
          </form>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Action cards */}
        <section>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((a) => (
              <button
                key={a.title}
                onClick={() => handleAction(a)}
                className={`${a.bg} rounded-2xl shadow p-6 text-left hover:shadow-lg transition-shadow group`}
              >
                <a.icon className={`w-8 h-8 ${a.color} mb-3`} />
                <h3 className="font-semibold text-gray-800 group-hover:text-caribbean transition-colors">
                  {a.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{a.desc}</p>
                <span className={`inline-flex items-center gap-1 text-sm font-medium mt-3 ${a.color}`}>
                  {t("edu_go")} <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Browse by category */}
        <section>
          <h2 className="text-2xl font-bold text-caribbean mb-4">{t("edu_browse_categories")}</h2>
          <div className="flex flex-wrap gap-3">
            {EDUCATION_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                to={`/education/library?category=${c.value}`}
                className="badge badge-lg bg-white text-tufts border border-gray-200 hover:border-caribbean hover:text-caribbean px-4 py-3"
              >
                {t(c.labelKey)}
              </Link>
            ))}
          </div>
        </section>

        {/* Recently approved */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-caribbean">{t("edu_recently_approved")}</h2>
            <Link to="/education/library" className="text-sm text-tufts hover:underline">
              {t("edu_view_all")}
            </Link>
          </div>
          {loading ? (
            <ResourceSkeleton count={3} />
          ) : recent.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <p className="text-gray-500">{t("edu_no_recent")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((r) => (
                <ResourceCard key={r._id} resource={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Education;
