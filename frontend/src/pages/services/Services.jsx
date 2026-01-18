import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
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

  return (
    <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-10 text-caribbean">
        Services
      </h1>

      <div className="gap-10 flex flex-col items-center text-center">
        {/* ------------------------------
          1. PROMOTIONS (Physio + Member + Guest View)
        ------------------------------- */}
        <div className="flex flex-col items-center p-6 bg-white shadow-md rounded-xl border border-gray-100">
          <BadgePercent className="w-10 h-10 text-caribbean mb-4" />
          <h2 className="text-xl text-tufts font-semibold mb-2">Physiotherapy Promotions</h2>
          <p className="text-gray-600 mb-4">
            Explore promotions created by certified physiotherapists.
          </p>

          <Link
            to="/services/promotions"
            className="btn bg-caribbean text-white w-full"
          >
            View Promotions
          </Link>

          {role === "physiotherapist" && (
            <Link
              to="/services/promotions/create"
              className="btn bg-tufts text-white mt-3 w-full"
            >
              Create Promotion
            </Link>
          )}
        </div>

        {/* ------------------------------
          2. SPONSORED PRODUCTS (Member + Physio + Admin)
        ------------------------------- */}
        <div className="flex flex-col items-center p-6 bg-white shadow-md rounded-xl border border-gray-100">
          <ShoppingBag className="w-10 h-10 text-caribbean mb-4" />
          <h2 className="text-xl text-tufts font-semibold mb-2">Sponsored Products</h2>
          <p className="text-gray-600 mb-4">
            Promote health-related products to reach more people.
          </p>

          <Link
            to="/services/sponsored"
            className="btn bg-caribbean text-white w-full"
          >
            View Sponsored Products
          </Link>

          {(role !== "guest") && (
            <Link
              to="/services/sponsored/create"
              className="btn bg-tufts text-white mt-3 w-full"
            >
              Add Product
            </Link>
          )}
        </div>

        {/* ------------------------------
          3. GUEST LOGIN CTA
        ------------------------------- */}
        {isGuest && (
          <div className="p-6 bg-white shadow-md rounded-xl border border-gray-100 md:col-span-3 text-center">
            <LockKeyhole className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl text-caribbean font-semibold mb-2">
              Want to access more services?
            </h2>
            <p className="text-gray-600 mb-6">
              Login or create an account to post products or promotions.
            </p>

            <Link
              to="/login"
              className="btn bg-caribbean text-white px-8 mx-2"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="btn bg-tufts text-white px-8 mx-2"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
