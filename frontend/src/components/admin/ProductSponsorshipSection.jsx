import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import toast from "react-hot-toast";
import { Link } from "react-router";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../../contexts/DashboardContext";
import { getSponsoredProducts } from "../../api/admin";

export default function ProductSponsorshipSection() {
  const { t } = useTranslation();
  const { sponsoredProducts, loading: dashboardLoading } = useDashboard();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isFirstRender = useRef(true);

  // Seed local list from dashboard context
  useEffect(() => {
    if (Array.isArray(sponsoredProducts) && sponsoredProducts.length > 0) {
      setProducts(sponsoredProducts);
    }
  }, [sponsoredProducts]);

  // Filters
  const [search, setSearch] = useState(""); // search by product name
  const [status, setStatus] = useState(""); // active/inactive
  const [loading, setLoading] = useState(false);

  const loadSponsoredProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSponsoredProducts({ search, status, page });
      setProducts(response.products || []);
      // Update totalPages from response if available
      if (response && response.totalPages) {
        setTotalPages(response.totalPages);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("failed_load_sponsored"));
    } finally {
      setLoading(false);
    }
  }, [search, status, page, t]);

  useEffect(() => {
    // Load sponsored products when filters or page change — skipped on mount (context provides initial data)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadSponsoredProducts();
  }, [loadSponsoredProducts]);

  // Stats derived from the sponsored products dataset in context
  const stats = useMemo(() => {
    const source = Array.isArray(sponsoredProducts) ? sponsoredProducts : [];
    return {
      total: source.length,
      active: source.filter((p) => p.isActive).length,
      inactive: source.filter((p) => !p.isActive).length,
    };
  }, [sponsoredProducts]);

  const isLoading = dashboardLoading || loading;

  return (
    <CollapsibleSection title={t("sponsored_products")}>
      <div className="flex justify-end mb-3">
        <button onClick={loadSponsoredProducts} className="btn btn-xs btn-ghost text-caribbean">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            ["stat_total", stats.total],
            ["status_active", stats.active],
            ["status_inactive", stats.inactive],
          ].map(([key, val]) => (
            <div key={key} className="bg-alice rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-caribbean">{val}</p>
              <p className="text-[10px] text-gray-500">{t(key)}</p>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          type="text"
          placeholder={t("search_placeholder_products")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-bordered input-xs"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="select select-bordered select-xs"
        >
          <option value="">{t("filter_all")}</option>
          <option value="active">{t("status_active")}</option>
          <option value="inactive">{t("status_inactive")}</option>
        </select>
      </div>

      {/* PRODUCT LIST */}
      {isLoading ? (
        <SectionSkeleton count={3} />
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{t("no_products_found")}</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {products.map((product) => (
            <div
              key={product._id}
              className="border border-gray-200 rounded-xl p-3 flex gap-4"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 rounded object-cover border"
              />
              <div className="text-sm flex-1 min-w-0">
                <Link to={`/admin/sponsored-products/${product._id}`}>
                  <h3 className="font-bold text-caribbean text-lg">{product.name}</h3>
                </Link>
                <div className="text-tufts">
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
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 1}
          className="btn btn-xs btn-outline border-caribbean text-caribbean hover:bg-caribbean hover:text-white disabled:opacity-50"
        >
          {t("prev")}
        </button>

        <span className="text-sm font-bold text-caribbean">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page === totalPages}
          className="btn btn-xs btn-outline border-caribbean text-caribbean hover:bg-caribbean hover:text-white disabled:opacity-50"
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
