import { Link } from "react-router";
import { useTranslation } from "react-i18next";

const ForumSubManagement = ({ forumSubs = [] }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language
  const fallbackLang = "en"

  if (!forumSubs.length)
    return (
      <p className="text-gray-500">
        {t("no_created_subs")}
      </p>
    );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-2">
          {t("forum_sub_management")}
        </h2>

        {forumSubs.map((sub) => (
          <Link
            key={sub._id}
            to={`/forum/sub/${sub._id}/manage`}
            className="block bg-gray-50 rounded-lg p-3 hover:bg-alice transition-colors"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-black">{sub.title[currentLang] || sub.title[fallbackLang]}</span>

              <span className="text-gray-400 text-sm">
                {t("rules_count", {
                  count: sub.rules?.filter((r) => r[currentLang] || r.en)?.length || 0,
                })}
              </span>
            </div>

            <p className="text-gray-500 text-sm line-clamp-2">
              {sub.description[currentLang]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ForumSubManagement;
