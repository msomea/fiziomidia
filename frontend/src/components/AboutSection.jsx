import { Link } from "react-router";
import about from "../assets/about_pt.jpg";

export default function AboutSection() {
  return (
    <section className="py-16 bg-alice" id="about">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
        {/* Left: Image */}
        <img
          src={about}
          alt="About physiotherapy"
          className="rounded-2xl shadow-lg max-w-sm mx-auto"
        />

        {/* Right: Text */}
        <div className="max-w-lg text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
            About <span className="text-caribbean">FizioMidia</span>
          </h2>
          <p className="text-gray-600 mb-6">
            FizioMidia is a digital physiotherapy platform empowering healthcare
            professionals and patients across Tanzania. We focus on improving
            accessibility to physiotherapy services, professional education, and
            community engagement.
          </p>
          <Link
            to="/about"
            className="btn bg-caribbean text-white border-none hover:bg-tufts"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}
