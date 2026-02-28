import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { API_URL, ASSET_URL } from "../../config/constants";
import { X, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { useTranslation } from 'react-i18next'
import toast from "react-hot-toast";

export default function AdminSponsorshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingSponsor, setSavingSponsor] = useState(false);
  // Sponsorship form
  const [form, setForm] = useState({
    isSponsored: false,
    sponsorTitle: { en: "", sw: "" }, 
    sponsorName: { en: "", sw: "" },
    sponsorLogo: "",
    sponsorMessage: { en: "", sw: "" },
    sponsorWebsite: "",
    startDate: "",
    endDate: "",
  });

  // NEW: basic sub info form for both EN & SW
  const [basicForm, setBasicForm] = useState({
    title: { en: "", sw: "" },
    description: { en: "", sw: "" },
    slug: "",
  });

  const [newLogo, setNewLogo] = useState(null);
  const { t } = useTranslation()

  useEffect(() => {
    loadSub();
  }, []);

  const loadSub = async () => {
    try {
      setLoading(true);
      const res = await API.get(`${API_URL}/admin/subs/${id}`);
      const s = res.data.sub;
      setSub(s);

      // Load sponsorship
      setForm({
        isSponsored: s.isSponsored,
        sponsorTitle: {
          en: s.sponsorTitle?.en || "",
          sw: s.sponsorTitle?.sw || "",
        },
        sponsorName: {
          en: s.sponsorName?.en || "",
          sw: s.sponsorName?.sw || "",
        },
        sponsorLogo: s.sponsorLogo || "",
        sponsorMessage: {
          en: s.sponsorMessage?.en || "",
          sw: s.sponsorMessage?.sw || "",
        },
        sponsorWebsite: s.sponsorWebsite || "",
        startDate: s.startDate ? dayjs(s.startDate).format("YYYY-MM-DD") : "",
        endDate: s.endDate ? dayjs(s.endDate).format("YYYY-MM-DD") : "",
      });

      // Load multilingual basic info
      setBasicForm({
        title: {
          en: s.title?.en || "",
          sw: s.title?.sw || "",
        },
        description: {
          en: s.description?.en || "",
          sw: s.description?.sw || "",
        },
        slug: s.slug || "",
      });
    } catch (err) {
      toast.error(t('failed_load_sub'));
    } finally {
      setLoading(false);
    }
  };

  const handleBasicChange = (e, lang = null, field = null) => {
    if (lang && field) {
      // Update en/sw field
      setBasicForm({
        ...basicForm,
        [field]: { ...basicForm[field], [lang]: e.target.value },
      });
    } else {
      setBasicForm({ ...basicForm, [e.target.name]: e.target.value });
    }
  };

  const handleSponsorChange = (e, lang = null, field = null) => {
    if (lang && field) {
      setForm({
        ...form,
        [field]: { ...form[field], [lang]: e.target.value },
      });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  // ✅ Update basic sub info
  const updateSubInfo = async () => {
    // Validation: require both EN & SW title and description
    if (
      !basicForm.title.en.trim() ||
      !basicForm.title.sw.trim() ||
      !basicForm.description.en.trim() ||
      !basicForm.description.sw.trim()
    ) {
      toast.error(t('fill_both_languages'));
      return;
    }

    try {
      setSavingBasic(true);

      const res = await API.put(`${API_URL}/forum/subs/${id}`, basicForm);

      if (!res.data?.success) throw new Error();

      toast.success(t('sub_information_updated'));
      loadSub();
    } catch (err) {
      toast.error(t('failed_update_sub_information'));
    } finally {
      setSavingBasic(false);
    }
  };

  // Sponsorship update (unchanged)
  const updateSponsorship = async () => {
    // Optional: validate EN + SW filled
    if (!form.sponsorName.en || !form.sponsorName.sw || !form.sponsorMessage.en || !form.sponsorMessage.sw) {
      toast.error(t('fill_both_languages'));
      return;
    }

    try {
      setSavingSponsor(true);

      const data = new FormData();
      data.append("isSponsored", form.isSponsored);
      data.append("sponsorTitle", JSON.stringify(form.sponsorTitle));
      data.append("sponsorName", JSON.stringify(form.sponsorName));
      data.append("sponsorMessage", JSON.stringify(form.sponsorMessage)); 
      data.append("sponsorWebsite", form.sponsorWebsite);
      data.append("startDate", form.startDate);
      data.append("endDate", form.endDate);

      if (newLogo) data.append("logo", newLogo);
      if (newLogo.size > 2 * 1024 * 1024) {
        return toast.error(t("image_size_limit"));
      }

      await API.put(`${API_URL}/admin/subs/${id}/sponsorship`, data);

      toast.success(t('sponsorship_updated'));
      loadSub();
    } catch (err) {
      toast.error(t('update_failed'));
    } finally {
      setSavingSponsor(false);
    }
  };

  const removeSponsorship = async () => {
    if (!confirm(t('confirm_remove_sponsorship'))) return;

    try {
      await API.put(`${API_URL}/admin/subs/${id}/sponsorship`, { isSponsored: false });
      toast.success(t('sponsorship_removed'));
      navigate(-1);
    } catch (err) {
      toast.error(t('failed_remove_sponsorship'));
    }
  };

  if (loading || !sub) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t('loading_sub')}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold text-lg text-caribbean">
          {t('manage_sub')} — {sub.title?.en}
        </h2>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-500 hover:text-red-800" />
        </button>
      </div>

      <div className="space-y-6 text-sm">

        {/* BASIC SUB INFO (NEW) */}
        <div className="bg-gray-100 p-4 rounded space-y-3">
          <h3 className="font-semibold text-caribbean">{t('sub_information')}</h3>

          {/* EN Title */}
          <input
            name="title_en"
            value={basicForm.title.en}
            onChange={(e) => handleBasicChange(e, 'en', 'title')}
            placeholder={`${t('sub_title_placeholder')} (EN)`}
            className="w-full border p-2 rounded"
          />
          {/* SW Title */}
          <input
            name="title_sw"
            value={basicForm.title.sw}
            onChange={(e) => handleBasicChange(e, 'sw', 'title')}
            placeholder={`${t('sub_title_placeholder')} (SW)`}
            className="w-full border p-2 rounded"
          />

          {/* EN Description */}
          <textarea
            name="description_en"
            value={basicForm.description.en}
            onChange={(e) => handleBasicChange(e, 'en', 'description')}
            placeholder={`${t('sub_description_placeholder')} (EN)`}
            className="w-full border p-2 rounded"
          />
          {/* SW Description */}
          <textarea
            name="description_sw"
            value={basicForm.description.sw}
            onChange={(e) => handleBasicChange(e, 'sw', 'description')}
            placeholder={`${t('sub_description_placeholder')} (SW)`}
            className="w-full border p-2 rounded"
          />

          <input
            name="slug"
            value={basicForm.slug}
            onChange={handleBasicChange}
            placeholder={t('sub_slug_placeholder')}
            className="w-full border p-2 rounded"
          />

          <button
            onClick={updateSubInfo}
            disabled={savingBasic}
            className="bg-tufts text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
          >
            {savingBasic ? t('saving') : t('save_sub_info')}
          </button>

        </div>

        {/* SPONSORSHIP */}
        <div className="bg-gray-100 p-4 rounded space-y-3">
          <h3 className="font-semibold text-caribbean">{t('sponsorship')}</h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isSponsored}
              onChange={(e) =>
                setForm({ ...form, isSponsored: e.target.checked })
              }
            />
            {t('enable_sponsorship')}
          </label>

          {form.isSponsored && (
            <>
              {/* Sponsor Title */}
              <input
                value={form.sponsorTitle.en}
                onChange={(e) => handleSponsorChange(e, 'en', 'sponsorTitle')}
                placeholder={`${t('sponsor_title_placeholder')} (EN)`}
                className="w-full border p-2 rounded"
              />
              <input
                value={form.sponsorTitle.sw}
                onChange={(e) => handleSponsorChange(e, 'sw', 'sponsorTitle')}
                placeholder={`${t('sponsor_title_placeholder')} (SW)`}
                className="w-full border p-2 rounded"
              />
              {/* Sponsor Name */}
              <input
                value={form.sponsorName.en}
                onChange={(e) => handleSponsorChange(e, 'en', 'sponsorName')}
                placeholder={`${t('sponsor_name_placeholder')} (EN)`}
                className="w-full border p-2 rounded"
              />
              <input
                value={form.sponsorName.sw}
                onChange={(e) => handleSponsorChange(e, 'sw', 'sponsorName')}
                placeholder={`${t('sponsor_name_placeholder')} (SW)`}
                className="w-full border p-2 rounded"
              />

              {/* Sponsor Message */}
              <textarea
                value={form.sponsorMessage.en}
                onChange={(e) => handleSponsorChange(e, 'en', 'sponsorMessage')}
                placeholder={`${t('sponsor_message_placeholder')} (EN)`}
                className="w-full border p-2 rounded"
              />
              <textarea
                value={form.sponsorMessage.sw}
                onChange={(e) => handleSponsorChange(e, 'sw', 'sponsorMessage')}
                placeholder={`${t('sponsor_message_placeholder')} (SW)`}
                className="w-full border p-2 rounded"
              />

              {/* The rest remains unchanged */}
              <input
                name="sponsorWebsite"
                value={form.sponsorWebsite}
                onChange={handleSponsorChange}
                placeholder={t('sponsor_website_placeholder')}
                className="w-full border p-2 rounded"
              />

              {form.sponsorLogo && (
                <img
                  src={form.sponsorLogo}
                  className="w-24 h-24 rounded border object-cover"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewLogo(e.target.files[0])}
              />

              <div className="flex gap-4">
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleSponsorChange}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleSponsorChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3">
          <button
            onClick={updateSponsorship}
            disabled={savingSponsor}
            className="bg-caribbean text-white py-2 rounded hover:bg-tufts disabled:opacity-50"
          >
            {savingSponsor ? t('saving') : t('save_sponsorship')}
          </button>

          {sub.isSponsored && (
            <button
              onClick={removeSponsorship}
              className="bg-red-600 text-white py-2 rounded"
            >
              {t('remove_sponsorship')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}