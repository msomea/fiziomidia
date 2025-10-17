import React from "react";
import { Link } from "react-router";
import hero_img from "../../assets/hero_pt.jpg";

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-b from-caribbean to-tufts text-white py-20">
      <div className="max-w-6xl mx-auto text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Connect with Expert Physiotherapists
        </h1>
        <p className="text-lg md:text-xl mb-8">
          Book appointments, access educational resources, and promote your physiotherapy services — all in one platform.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/signup" className="btn bg-white text-caribbean hover:bg-alice border-none">
            Get Started
          </Link>
          <Link to="/forum" className="btn btn-outline text-white border-white hover:bg-white hover:text-caribbean">
            Visit Forum
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
