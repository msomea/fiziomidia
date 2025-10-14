import HeroSection from "../components/home/HeroSection";
//import HeroSection from "../components/HeroSection";
import ServiceCards from "../components/ServiceCards";
import CallToAction from "../components/home/CallToAction";
import FindProfessionals from "../components/home/FindProfessionals";
import SponsoredContent from "../components/home/SponsoredContent";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ServiceCards />
      <FindProfessionals />
      <SponsoredContent />
      <CallToAction  />
    </>
  );
}
