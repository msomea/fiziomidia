import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { X } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { API_URL } from "../../config/constants";

export default function AdminSponsorshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    isSponsored: false,
    sponsorName: "",
    sponsorLogo: "",
    sponsorMessage: "",
    sponsorWebsite: "",
    startDate: "",
    endDate: "",
  });

  const [newLogo, setNewLogo] = useState(null);

  useEffect(() => {
    loadSub();
  }, []);

  const loadSub = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/admin/subs/${id}`);
      setSub(res.data.sub);

      setForm({
        isSponsored: res.data.sub.isSponsored,
        sponsorName: res.data.sub.sponsorName || "",
        sponsorLogo: res.data.sub.sponsorLogo || "",
        sponsorMessage: res.data.sub.sponsorMessage || "",
        sponsorWebsite: res.data.sub.sponsorWebsite || "",
        startDate: res.data.sub.startDate
          ? dayjs(res.data.sub.startDate).format("YYYY-MM-DD")
          : "",
        endDate: res.data.sub.endDate
          ? dayjs(res.data.sub.endDate).format("YYYY-MM-DD")
          : "",
      });
    } catch (err) {
      toast.error("Failed to load sub");
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

      await API.put(`/admin/subs/${id}/sponsorship`, data);

      toast.success("Sponsorship updated");
      loadSub();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const removeSponsorship = async () => {
    if (!confirm("Remove sponsorship completely?")) return;

    try {
      await API.put(`/admin/subs/${id}/sponsorship`, { isSponsored: false });
      toast.success("Sponsorship removed");
      navigate(-1);
    } catch (err) {
      toast.error("Failed to remove sponsorship");
    }
  };

  if (loading || !sub)
    return <p className="mt-20 text-gray-500">Loading Sponsorship...</p>;
  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between mb-4 ">
        <h2 className="font-semibold text-lg text-caribbean">
          Manage Sponsorship — {sub.title}
        </h2>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-500 hover:text-red-800" />
        </button>
      </div>

      <div className="space-y-6 text-sm">

        {/* BASIC INFO */}
        <div className="bg-gray-100 p-3 rounded text-tufts">
          <h3 className="font-semibold mb-2">Sub Information</h3>
          <p><b>Title:</b> {sub.title}</p>
          <p><b>Created By:</b> {sub.createdBy?.fullName}</p>
          <p><b>Description:</b> {sub.description}</p>
        </div>

        {/* SPONSORSHIP FIELDS */}
        <div className="bg-gray-100 p-4 rounded space-y-3 text-tufts">
          <h3 className="font-semibold mb-2 text-caribbean">Sponsorship Details</h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isSponsored}
              onChange={(e) =>
                setForm({ ...form, isSponsored: e.target.checked })
              }
            />
            <span>Enable Sponsorship</span>
          </label>

          {form.isSponsored && (
            <>
              <input
                name="sponsorName"
                value={form.sponsorName}
                onChange={handleChange}
                placeholder="Sponsor Name"
                className="w-full border p-2 rounded"
              />

              <textarea
                name="sponsorMessage"
                value={form.sponsorMessage}
                onChange={handleChange}
                placeholder="Sponsor Message"
                className="w-full border p-2 rounded"
              />

              <input
                name="sponsorWebsite"
                value={form.sponsorWebsite}
                onChange={handleChange}
                placeholder="Sponsor Website URL"
                className="w-full border p-2 rounded"
              />

              {/* LOGO UPLOAD */}
              <div>
                <p className="font-medium mb-1">Sponsor Logo</p>

                {form.sponsorLogo && (
                  <img
                    src={`${API_URL}${form.sponsorLogo}`}
                    alt="Logo"
                    className="w-24 h-24 rounded object-cover mb-2 border"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewLogo(e.target.files[0])}
                />
              </div>

              {/* DATES */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div className="flex-1">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={updateSponsorship}
            className="w-full py-2 bg-caribbean text-white rounded hover:bg-caribbean-dark"
          >
            Save Changes
          </button>

          {sub.isSponsored && (
            <button
              onClick={removeSponsorship}
              className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Remove Sponsorship
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
