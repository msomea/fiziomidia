import { useEffect, useState } from "react";
import { fetchAdminPromotions } from "../../api/admin";
import toast from "react-hot-toast";
import dayjs from "dayjs"

export default function PromotionsSection() {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAdminPromotions();
        setPromotions(res.promotions);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load promotions");
      }
    };
    load();
  }, []);

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="font-bold text-caribbean text-lg">Promotions</h2>

      {promotions.slice(0, 5).map((promo) => (
        <div key={promo._id} className="mt-2 p-2 bg-gray-100 text-sm rounded text-tufts">
          <p><b>PT:</b> {promo.pt.fullName}</p>
          <p><b>Due Date:</b> {dayjs(promo.endAt).format("ddd, DD/MM/YYYY")}</p>
        </div>
      ))}

      <p className="text-xs text-gray-400 mt-2">Showing first 5 promotions</p>
    </div>
  );
}
