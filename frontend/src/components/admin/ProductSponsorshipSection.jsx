import { useEffect, useState } from "react";
import { getSponsoredProducts } from "../../api/admin";
import CollapsibleSection from "./CollapsibleSection";
import toast from "react-hot-toast";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export default function ProductSponsorshipSection() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState(""); // search by product name
  const [status, setStatus] = useState(""); // active/inactive

  useEffect(() => {
    loadSponsoredProducts();
  }, [search, status, page]);

  const loadSponsoredProducts = async () => {
    try {
      const res = await getSponsoredProducts({ search, status, page });
      setProducts(res.products || []);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error(t("failed_load_sponsored"));
    }
  };

  return (
    <CollapsibleSection title={t("sponsored_products")}>
      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          type="text"
          placeholder={t("search_placeholder_products")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">{t("filter_all")}</option>
          <option value="active">{t("status_active")}</option>
          <option value="inactive">{t("status_inactive")}</option>
        </select>
      </div>

      {/* PRODUCT LIST */}
      {products.map((product) => (
        <div
          key={product._id}
          className="mt-3 p-3 bg-gray-100 rounded text-tufts flex gap-4"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-20 h-20 rounded object-cover border"
          />
          <div className="text-sm flex-1">
            <Link to={`/admin/sponsored-products/${product._id}`}>
              <h3 className="font-bold text-caribbean text-lg">{product.name}</h3>
            </Link>
            <p>
              <b>{t("owner_label")}</b> {product.owner?.fullName}
            </p>
            <p>
              <b>{t("price_label")}</b> {product.price}
            </p>
            <p>
              <b>{t("description_label")}</b> {product.description}
            </p>
            <p>
              <b>{t("end_date")}</b> {product.endDate}
            </p>
            <p>
              <b>{t("status_label")}</b>{" "}
              {product.isActive ? t("status_active") : t("status_inactive")}
            </p>
            {product.link && (
              <p>
                <b>{t("link_label")}</b>{" "}
                <a
                  href={`https://${product.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {t("visit_link")}
                </a>
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-4">
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 1}
          className="btn btn-sm bg-gray-200 text-accent disabled:opacity-50"
        >
          {t("prev")}
        </button>

        <span className="font-bold text-caribbean">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page === totalPages}
          className="btn btn-sm bg-caribbean text-white hover:bg-tufts"
        >
          {t("next")}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        {t("showing_sponsored_products", { count: products.length })}
      </p>
    </CollapsibleSection>
  );
}
