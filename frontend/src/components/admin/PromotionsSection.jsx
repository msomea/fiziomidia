import { useEffect, useState } from "react";
import { fetchAdminPromotions } from "../../api/admin";
import CollapsibleSection from "./CollapsibleSection";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Link } from "react-router";

export default function PromotionsSection() {
  const [promotions, setPromotions] = useState([]);

  // Filters
  const [search, setSearch] = useState("");       // search PT name or email
  const [status, setStatus] = useState("");       // sort/filter by status

  useEffect(() => {
    loadPromotions();
  }, [search, status]);

  const loadPromotions = async () => {
    try {
      const res = await fetchAdminPromotions({
        search,
        status
      });

      setPromotions(res.promotions || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load promotions");
    }
  };

  return (
    <CollapsibleSection title="PT Promotions">

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Search PT name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* PROMOTIONS LIST */}
      {promotions.slice(0, 10).map((promo) => (
        <div key={promo._id} className="mt-2 p-2 bg-gray-100 rounded text-tufts">
          <Link to={`/admin/promotions/${promo._id}`}>
            <h3 className="font-bold textarea-s text-caribbean">
              Promotion #{promo._id}
            </h3>
          </Link>
          <div className="text-sm">
            <p><b>PT:</b> {promo.pt.fullName}</p>
            <p><b>Email:</b> {promo.pt.email}</p>
            <p><b>Status:</b> {promo.status || "unknown"}</p>
            <p><b>Due Date:</b> {dayjs(promo.endAt).format("ddd, DD/MM/YYYY")}</p>
          </div>
        </div>
      ))}

      <p className="text-xs text-gray-400 mt-2">Showing first 10 promotions</p>
    </CollapsibleSection>
  );
}
