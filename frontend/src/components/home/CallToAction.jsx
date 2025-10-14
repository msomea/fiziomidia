import { Link } from "react-router";
import about from "../../assets/about_pt.jpg";

export default function CallToAction() {
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
            Join the <span className="text-caribbean">FizioMidia</span> Community
          </h2>
          <p className="text-gray-600 mb-6">
            FizioMidia is a digital physiotherapy platform empowering healthcare
            professionals and patients across Tanzania. We focus on improving
            accessibility to physiotherapy services, professional education, and
            community engagement.Connect with physiotherapists, share knowledge, 
            and promote better health today
          </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="btn bg-white text-tufts hover:bg-alice hover:border-tufts border-2">
            Sign Up
          </Link>
          <Link to="/login" className="btn btn-outline border-tufts border-2 text-tufts hover:bg-white hover:text-tufts hover:border-white">
            Log In
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}
