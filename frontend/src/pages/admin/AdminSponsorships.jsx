import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import {toast} from "react-hot-toast";

const AdminSponsorships = () => {
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

  // Fetch all forum subs
  const fetchSubs = async () => {
    try {
      const res = await API.get("/api/forum/subs"); // authenticated admin route
      setSubs(res.data.subs || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch forum subs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle select sub
  const handleSubSelect = (e) => {
    const subId = e.target.value;
    setForm({ ...form, subId });

    // Preload sponsorship info if any
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

  // Add or update sponsorship
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subId) return toast.error("Select a forum sub first.");

    try {
      const res = await API.put(`/admin/subs/${form.subId}/sponsorship`, form);
      toast.success("Sponsorship updated successfully.");
      fetchSubs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update sponsorship.");
    }
  };

  // Remove sponsorship
  const handleRemove = async (subId) => {
    if (!window.confirm("Remove sponsorship?")) return;
    try {
      await API.put(`/admin/subs/${subId}/sponsorship/remove`);
      toast.success("Sponsorship removed.");
      fetchSubs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove sponsorship.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-alice mt-20">
      <h1 className="text-3xl font-bold text-caribbean mb-6">Manage Sponsorships</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sub List */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Forum Subs</h2>
            <ul className="space-y-2">
              {subs.map((sub) => {
                const now = new Date();
                let status = sub.isSponsored ? "Active" : "None";
                if (sub.isSponsored && sub.endDate && new Date(sub.endDate) < now)
                  status = "Expired";
                else if (sub.isSponsored && sub.endDate && new Date(sub.endDate) - now < 3 * 24 * 60 * 60 * 1000)
                  status = "Expiring Soon";

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
                        Remove
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sponsorship Form */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Add / Edit Sponsorship</h2>
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md space-y-3">
              <select
                name="subId"
                value={form.subId}
                onChange={handleSubSelect}
                className="select w-full"
              >
                <option value="">Select Forum Sub</option>
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
                placeholder="Sponsor Name"
                className="input w-full"
              />
              <input
                type="text"
                name="sponsorLogo"
                value={form.sponsorLogo}
                onChange={handleChange}
                placeholder="Sponsor Logo URL"
                className="input w-full"
              />
              <input
                type="text"
                name="sponsorMessage"
                value={form.sponsorMessage}
                onChange={handleChange}
                placeholder="Sponsor Message"
                className="input w-full"
              />
              <input
                type="text"
                name="sponsorWebsite"
                value={form.sponsorWebsite}
                onChange={handleChange}
                placeholder="Sponsor Website"
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
                Save Sponsorship
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSponsorships;
