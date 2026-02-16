import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import about from "../../assets/about_pt.jpg";

export default function CallToAction() {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-alice" id="about">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
        {/* Left: Image */}
        <img
          src={about}
          alt="About physiotherapy"
          className="w-full max-w-xs sm:max-w-sm rounded-2xl shadow-lg mx-auto ring ring-caribbean ring-opacity-50"
        />

        {/* Right: Text */}
        <div className="max-w-lg text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
            {t("join_fiziomidia_community")}
          </h2>
          <p className="text-gray-600 mb-6">
            {t("cta_desc")}
          </p>
        <div className="flex justify-center gap-4">
          <Link to="/signup" className="btn bg-white text-tufts hover:bg-alice hover:border-tufts border-2">
            {t("sign_up")}
          </Link>
          <Link to="/login" className="btn btn-outline border-tufts border-2 text-tufts hover:bg-white hover:text-tufts hover:border-white">
            {t("login")}
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}
