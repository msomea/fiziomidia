import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from 'react-i18next'
import {
  BadgePercent,
  PlusCircle,
  ShoppingBag,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export default function Services() {
  const { user } = useAuth();
  const isGuest = user.role === "guest";
  const role = user.role;
  const { t } = useTranslation()

  return (
    <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-10 text-caribbean">
        {t('services')}
      </h1>

      <div className="gap-10 flex flex-col items-center text-center">
        {/* ------------------------------
          1. PROMOTIONS (Physio + Member + Guest View)
        ------------------------------- */}
        <div className="w-full max-w-md flex flex-col items-center p-6 bg-white shadow-md rounded-xl border border-gray-100">
          <BadgePercent className="w-10 h-10 text-caribbean mb-4" />
          <h2 className="text-xl text-tufts font-semibold mb-2">{t('promotions_title')}</h2>
          <p className="text-gray-600 mb-4">{t('promotions_desc')}</p>

          <Link
            to="/services/promotions"
            className="btn bg-caribbean text-white w-full"
          >
            {t('view_promotions')}
          </Link>

          {role === "physiotherapist" && (
            <Link
              to="/services/promotions/create"
              className="btn bg-tufts text-white mt-3 w-full"
            >
              {t('create_promotion')}
            </Link>
          )}
        </div>

        {/* ------------------------------
          2. SPONSORED PRODUCTS (Member + Physio + Admin)
        ------------------------------- */}
        <div className="w-full max-w-md flex flex-col items-center p-6 bg-white shadow-md rounded-xl border border-gray-100">
          <ShoppingBag className="w-10 h-10 text-caribbean mb-4" />
          <h2 className="text-xl text-tufts font-semibold mb-2">{t('sponsored_products')}</h2>
          <p className="text-gray-600 mb-4">{t('sponsored_products_desc')}</p>

          <Link
            to="/services/sponsored"
            className="btn bg-caribbean text-white w-full"
          >
            {t('view_sponsored_products')}
          </Link>

          {(role !== "guest") && (
            <Link
              to="/services/sponsored/create"
              className="btn bg-tufts text-white mt-3 w-full"
            >
              {t('add_product')}
            </Link>
          )}
        </div>

        {/* ------------------------------
          3. GUEST LOGIN CTA
        ------------------------------- */}
        {isGuest && (
          <div className="w-full max-w-md p-6 bg-white shadow-md rounded-xl border border-gray-100 text-center">
            <LockKeyhole className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl text-caribbean font-semibold mb-2">{t('guest_more_services')}</h2>
            <p className="text-gray-600 mb-6">{t('guest_cta_desc')}</p>

            <Link
              to="/login"
              className="btn bg-caribbean text-white px-8 mx-2"
            >
              {t('login')}
            </Link>

            <Link
              to="/signup"
              className="btn bg-tufts text-white px-8 mx-2"
            >
              {t('register')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
