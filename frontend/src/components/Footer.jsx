import { Facebook, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-10 mt-16">
      <div className="container mx-auto px-4 text-center">
        {/* Logo */}
        <h3 className="text-2xl font-bold mb-4">
          Fizio<span className="text-caribbean">Midia</span>
        </h3>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
          <a href="/" className="hover:text-caribbean">Home</a>
          <a href="/about" className="hover:text-caribbean">About</a>
          <a href="/services" className="hover:text-caribbean">Services</a>
          <a href="/forum" className="hover:text-caribbean">Forum</a>
          <a href="/education" className="hover:text-caribbean">Education</a>
          <a href="/contact" className="hover:text-caribbean">Contact</a>
        </div>

        {/* Social Media */}
        <div className="flex justify-center gap-4 mb-6">
          <a href="#" className="hover:text-caribbean"><Facebook size={20} /></a>
          <a href="#" className="hover:text-caribbean"><Instagram size={20} /></a>
          <a href="#" className="hover:text-caribbean"><Linkedin size={20} /></a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} FizioMidia. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
