import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { API_URL, ASSET_URL } from "../../config/constants";
import { X, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";

export default function AdminSponsorshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sponsorship form
  const [form, setForm] = useState({
    isSponsored: false,
    sponsorName: "",
    sponsorLogo: "",
    sponsorMessage: "",
    sponsorWebsite: "",
    startDate: "",
    endDate: "",
  });

  // NEW: basic sub info form
  const [basicForm, setBasicForm] = useState({
    title: "",
    description: "",
    slug: "",
  });

  const [newLogo, setNewLogo] = useState(null);

  useEffect(() => {
    loadSub();
  }, []);

  const loadSub = async () => {
    try {
      setLoading(true);
      const res = await API.get(`${API_URL}/admin/subs/${id}`);
      const s = res.data.sub;
      setSub(s);

      setForm({
        isSponsored: s.isSponsored,
        sponsorName: s.sponsorName || "",
        sponsorLogo: s.sponsorLogo || "",
        sponsorMessage: s.sponsorMessage || "",
        sponsorWebsite: s.sponsorWebsite || "",
        startDate: s.startDate ? dayjs(s.startDate).format("YYYY-MM-DD") : "",
        endDate: s.endDate ? dayjs(s.endDate).format("YYYY-MM-DD") : "",
      });

      setBasicForm({
        title: s.title || "",
        description: s.description || "",
        slug: s.slug || "",
      });
    } catch (err) {
      toast.error("Failed to load sub");
    } finally {
      setLoading(false);
    }
  };

  const handleBasicChange = (e) => {
    setBasicForm({ ...basicForm, [e.target.name]: e.target.value });
  };

  const handleSponsorChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Update basic sub info
  const updateSubInfo = async () => {
    try {
      const res = await API.put(`${API_URL}/forum/subs/${id}`, basicForm);

      if (!res.data?.success) throw new Error();

      toast.success("Sub information updated");
      loadSub();
    } catch (err) {
      toast.error("Failed to update sub information");
    }
  };

  // Sponsorship update (unchanged)
  const updateSponsorship = async () => {
    try {
      const data = new FormData();
      data.append("isSponsored", form.isSponsored);
      data.append("sponsorName", form.sponsorName);
      data.append("sponsorMessage", form.sponsorMessage);
      data.append("sponsorWebsite", form.sponsorWebsite);
      data.append("startDate", form.startDate);
      data.append("endDate", form.endDate);

      if (newLogo) data.append("logo", newLogo);

      await API.put(`${API_URL}/admin/subs/${id}/sponsorship`, data);

      toast.success("Sponsorship updated");
      loadSub();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const removeSponsorship = async () => {
    if (!confirm("Remove sponsorship completely?")) return;

    try {
      await API.put(`${API_URL}/admin/subs/${id}/sponsorship`, { isSponsored: false });
      toast.success("Sponsorship removed");
      navigate(-1);
    } catch (err) {
      toast.error("Failed to remove sponsorship");
    }
  };

  if (loading || !sub) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          Loading Sub...
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold text-lg text-caribbean">
          Manage Sub — {sub.title}
        </h2>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-500 hover:text-red-800" />
        </button>
      </div>

      <div className="space-y-6 text-sm">

        {/* BASIC SUB INFO (NEW) */}
        <div className="bg-gray-100 p-4 rounded space-y-3">
          <h3 className="font-semibold text-caribbean">Sub Information</h3>

          <input
            name="title"
            value={basicForm.title}
            onChange={handleBasicChange}
            placeholder="Sub title"
            className="w-full border p-2 rounded"
          />

          <textarea
            name="description"
            value={basicForm.description}
            onChange={handleBasicChange}
            placeholder="Sub description"
            className="w-full border p-2 rounded"
          />

          <input
            name="slug"
            value={basicForm.slug}
            onChange={handleBasicChange}
            placeholder="Sub slug (admin only)"
            className="w-full border p-2 rounded"
          />

          <button
            onClick={updateSubInfo}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Sub Info
          </button>
        </div>

        {/* SPONSORSHIP */}
        <div className="bg-gray-100 p-4 rounded space-y-3">
          <h3 className="font-semibold text-caribbean">Sponsorship</h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isSponsored}
              onChange={(e) =>
                setForm({ ...form, isSponsored: e.target.checked })
              }
            />
            Enable Sponsorship
          </label>

          {form.isSponsored && (
            <>
              <input
                name="sponsorName"
                value={form.sponsorName}
                onChange={handleSponsorChange}
                placeholder="Sponsor Name"
                className="w-full border p-2 rounded"
              />

              <textarea
                name="sponsorMessage"
                value={form.sponsorMessage}
                onChange={handleSponsorChange}
                placeholder="Sponsor Message"
                className="w-full border p-2 rounded"
              />

              <input
                name="sponsorWebsite"
                value={form.sponsorWebsite}
                onChange={handleSponsorChange}
                placeholder="Sponsor Website"
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
            className="bg-caribbean text-white py-2 rounded"
          >
            Save Sponsorship
          </button>

          {sub.isSponsored && (
            <button
              onClick={removeSponsorship}
              className="bg-red-600 text-white py-2 rounded"
            >
              Remove Sponsorship
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
