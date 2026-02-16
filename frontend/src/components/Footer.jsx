import { Facebook, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-black text-white py-10 mt-16">
      <div className="container mx-auto px-4 text-center">
        {/* Logo */}
        <h3 className="text-2xl font-bold mb-4">
          Fizio<span className="text-caribbean">Midia</span>
        </h3>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
          <a href="/" className="hover:text-caribbean">{t("home")}</a>
          <a href="/about" className="hover:text-caribbean">{t("about")}</a>
          <a href="/services" className="hover:text-caribbean">{t("services")}</a>
          <a href="/forum" className="hover:text-caribbean">{t("forum")}</a>
          <a href="/education" className="hover:text-caribbean">{t("education")}</a>
        </div>

        {/* Social Media */}
        <div className="flex justify-center gap-4 mb-6">
          <a
            href="https://www.facebook.com/fiziomidia"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-caribbean"
          >
            <Facebook size={20} />
          </a>
          <a
            href="https://www.instagram.com/fiziomidia/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-caribbean"
          >
            <Instagram size={20} />
          </a>

          {/* <a href="#" className="hover:text-caribbean"><Linkedin size={20} /></a> */}
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} {t("right_reserved")}.
        </p>
      </div>
    </footer>
  );
}
