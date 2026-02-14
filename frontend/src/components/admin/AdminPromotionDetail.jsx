import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { X, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";

export default function AdminPromotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [endAt, setEndAt] = useState("");

  useEffect(() => {
    loadPromotion();
  }, []);

  const loadPromotion = async () => {
    try {
      setLoading(true);
      const res = await API.get(`${API_URL}/admin/promotions/${id}`);
      setPromo(res.data.promotion);
      setStatus(res.data.promotion.status);

      // Convert to yyyy-mm-dd for HTML date input
      setEndAt(dayjs(res.data.promotion.endAt).format("YYYY-MM-DD"));
    } catch (err) {
      toast.error("Failed to load promotion");
    } finally {
      setLoading(false);
    }
  };

  const updatePromotion = async () => {
    try {
      await API.put(`${API_URL}/admin/promotions/${id}`, {
        status,
        endAt,
      });

      toast.success("Promotion updated");
      loadPromotion();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const deletePromotion = async () => {
  // Backup current promo
    const backupPromo = { ...promo };

    // Remove from UI immediately
    setPromo(null);

    let undoClicked = false;

    // Show toast with Undo button
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span>Promotion deleted</span>
          <button
            onClick={() => {
              undoClicked = true;
              setPromo(backupPromo);
              toast.dismiss(t.id);
            }}
            className="text-blue-500 underline"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 } // 5 seconds to undo
    );

    // Wait 5 seconds, then call backend if not undone
    setTimeout(async () => {
      if (undoClicked) return;
      try {
        await API.delete(`${API_URL}/admin/promotions/${id}`);
        toast.success("Promotion permanently deleted");
        navigate("/dashboard/admin"); // redirect after deletion
      } catch (err) {
        console.error(err);
        setPromo(backupPromo);
        toast.error("Failed to delete promotion");
      }
    }, 5000);
  };


  if (loading || !promo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Promotion...</p>
      </div>
    );
  }

  // Determine image: use promotion image if uploaded, otherwise PT profile image
  const promoImage = promo.imageUrl || promo.pt.profileImageUrl;

  return (
    <div className="border rounded-lg shadow bg-gray-50 p-4 mt-20 max-w-3xl mx-auto">
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold text-caribbean">Manage Promotion</h3>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-400 hover:text-red-800" />
        </button>
      </div>

      {/* IMAGE */}
      <div className="mb-4">
        <img
          src={promoImage}
          alt="Promotion"
          className="w-full h-64 object-cover rounded-lg border"
        />
      </div>

      <div className="space-y-4 text-sm text-tufts">
        {/* PT INFO */}
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-1 text-caribbean">PT Information</h3>
          <p><b>Name:</b> {promo.pt?.fullName}</p>
          <p><b>Email:</b> {promo.pt?.email}</p>
        </div>

        {/* PROMOTION INFO */}
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-1 text-caribbean">Promotion Details</h3>
          <p><b>Status:</b> {promo.status}</p>
          <p><b>Start:</b> {dayjs(promo.startAt).format("ddd, DD/MM/YYYY")}</p>
          <p><b>End:</b> {dayjs(promo.endAt).format("ddd, DD/MM/YYYY")}</p>
          <p><b>Created:</b> {dayjs(promo.createdAt).format("ddd, DD/MM/YYYY")}</p>
        </div>

        {/* EDIT PROMOTION */}
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-2 text-caribbean">Edit Promotion</h3>

          {/* STATUS SELECT */}
          <label className="font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 rounded w-full mb-4"
          >
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* EDIT END DATE */}
          <label className="font-medium">End Date</label>
          <input
            type="date"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <button
            onClick={updatePromotion}
            className="mt-4 px-4 py-2 bg-caribbean text-white rounded hover:bg-caribbean-dark w-full"
          >
            Save Changes
          </button>
        </div>

        {/* DELETE */}
        <button
          onClick={deletePromotion}
          className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete Promotion
        </button>
      </div>
    </div>
  );
}
