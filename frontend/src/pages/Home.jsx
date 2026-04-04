import HeroSection from "../components/home/HeroSection";
import ServiceCards from "../components/home/ServiceCards";
import CallToAction from "../components/home/CallToAction";
import FindProfessionals from "../components/home/FindProfessionals";
import SponsoredContent from "../components/home/SponsoredContent";
import FindClinics from "../components/home/FindClinics";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ServiceCards />
      <FindProfessionals />
      <FindClinics />
      <SponsoredContent />
      <CallToAction />
    </>
  );
}
