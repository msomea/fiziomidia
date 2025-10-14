import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import hero_img from "../assets/hero_pt.jpg";

export default function HeroSection() {
  return (
    <section className="hero min-h-screen bg-gradient-to-b from-caribbean to-tufts mt-[64px] md:mt-[40px]">
      <div className="hero-content flex-col md:flex-row-reverse gap-8">
        {/* Hero Image */}
        <img
          src={hero_img}
          alt="Physiotherapy session"
          className="max-w-xs sm:max-w-sm md:max-w-md rounded-2xl shadow-lg"
        />

        {/* Hero Text */}
        <div className="text-center md:text-left max-w-md">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black leading-tight">
            Empowering <span className="text-caribbean">Physiotherapy</span> in
            Tanzania
          </h1>
          <p className="py-4 text-gray-600">
            FizioMidia connects physiotherapists, patients, and the community
            through education, appointments, and digital engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link
              to="/services"
              className="btn bg-caribbean text-white border-none hover:bg-tufts"
            >
              Book Appointment <ArrowRight size={18} className="ml-1" />
            </Link>
            <Link
              to="/forum"
              className="btn btn-outline border-caribbean text-caribbean hover:bg-caribbean hover:text-white"
            >
              Join Forum
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
