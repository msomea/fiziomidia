import React, { useState, useEffect } from "react";
import { fetchForumSubs } from "../../api/forum";
import { updateSponsorship, removeSponsorship } from "../../api/admin";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const AdminSponsorships = () => {
  const { t } = useTranslation();

  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    subId: "",
    sponsorName: "",
    sponsorLogo: "",
    sponsorMessage: "",
    sponsorWebsite: "",
    startDate: "",
    endDate: "",
  });

  const fetchSubs = async () => {
    try {
      const data = await fetchForumSubs();
      setSubs(data.subs || []);
    } catch (err) {
      console.error(err);
      toast.error(t("failed_fetch_forum_subs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubSelect = (e) => {
    const subId = e.target.value;
    setForm({ ...form, subId });

    const sub = subs.find((s) => s._id === subId);
    if (sub) {
      setForm({
        ...form,
        subId,
        sponsorName: sub.sponsorName || "",
        sponsorLogo: sub.sponsorLogo || "",
        sponsorMessage: sub.sponsorMessage || "",
        sponsorWebsite: sub.sponsorWebsite || "",
        startDate: sub.startDate ? sub.startDate.slice(0, 10) : "",
        endDate: sub.endDate ? sub.endDate.slice(0, 10) : "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subId) return toast.error(t("select_forum_sub"));

    try {
      await updateSponsorship(form.subId, form);
      toast.success(t("sponsorship_updated_success"));
      fetchSubs();
    } catch (err) {
      console.error(err);
      toast.error(t("failed_update_sponsorship"));
    }
  };

  const handleRemove = async (subId) => {
    if (!window.confirm(t("confirm_remove_sponsorship"))) return;
    try {
      await removeSponsorship(subId);
      toast.success(t("sponsorship_removed"));
      fetchSubs();
    } catch (err) {
      console.error(err);
      toast.error(t("failed_remove_sponsorship"));
    }
  };

  return (
    <div className="min-h-screen p-6 bg-alice mt-20">
      <h1 className="text-3xl font-bold text-caribbean mb-6">
        {t("manage_sponsorships")}
      </h1>

      {loading ? (
        <div className="h-screen flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
          <p className="mt-4 text-caribbean font-medium animate-pulse">
            {t("loading_sponsorships")}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sub List */}
          <div>
            <h2 className="text-xl font-semibold mb-2">{t("forum_subs")}</h2>
            <ul className="space-y-2">
              {subs.map((sub) => {
                const now = new Date();
                let status = sub.isSponsored ? t("status_active") : t("status_none");
                if (sub.isSponsored && sub.endDate && new Date(sub.endDate) < now)
                  status = t("status_expired");
                else if (sub.isSponsored && sub.endDate && new Date(sub.endDate) - now < 3 * 24 * 60 * 60 * 1000)
                  status = t("status_expiring_soon");

                return (
                  <li
                    key={sub._id}
                    className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm"
                  >
                    <div>
                      <p className="font-semibold">{sub.title}</p>
                      {sub.isSponsored && (
                        <p className="text-sm text-gray-500">
                          {sub.sponsorName} ({status})
                        </p>
                      )}
                    </div>
                    {sub.isSponsored && (
                      <button
                        onClick={() => handleRemove(sub._id)}
                        className="btn btn-sm bg-red-500 text-white hover:bg-red-600"
                      >
                        {t("remove")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sponsorship Form */}
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {t("add_edit_sponsorship")}
            </h2>
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md space-y-3">
              <select
                name="subId"
                value={form.subId}
                onChange={handleSubSelect}
                className="select w-full"
              >
                <option value="">{t("select_forum_sub")}</option>
                {subs.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.title}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="sponsorName"
                value={form.sponsorName}
                onChange={handleChange}
                placeholder={t("sponsor_name")}
                className="input w-full"
              />
              <input
                type="text"
                name="sponsorLogo"
                value={form.sponsorLogo}
                onChange={handleChange}
                placeholder={t("sponsor_logo")}
                className="input w-full"
              />
              <input
                type="text"
                name="sponsorMessage"
                value={form.sponsorMessage}
                onChange={handleChange}
                placeholder={t("sponsor_message")}
                className="input w-full"
              />
              <input
                type="text"
                name="sponsorWebsite"
                value={form.sponsorWebsite}
                onChange={handleChange}
                placeholder={t("sponsor_website")}
                className="input w-full"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="input w-full"
                />
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="input w-full"
                />
              </div>

              <button type="submit" className="btn bg-caribbean text-white w-full hover:bg-tufts">
                {t("save_sponsorship")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSponsorships;
