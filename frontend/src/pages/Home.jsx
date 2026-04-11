import React, { useEffect } from "react";
import { HomePageProvider, useHomePage } from "../contexts/HomePageContext";
import HeroSection from "../components/home/HeroSection";
import ServiceCards from "../components/home/ServiceCards";
import CallToAction from "../components/home/CallToAction";
import FindProfessionals from "../components/home/FindProfessionals";
import SponsoredContent from "../components/home/SponsoredContent";
import FindClinics from "../components/home/FindClinics";

function HomeContent() {
  const { 
    ptPromotions, 
    clinicPromotions, 
    sponsoredProducts, 
    fetchHomePageData,
    forceRefreshHomePage 
  } = useHomePage();

  useEffect(() => {
    fetchHomePageData();
  }, []); // Empty dependency array - only run once on mount

  return (
    <>
      {/* Debug button - remove in production */}
      { 0 &&
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={forceRefreshHomePage}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Clear Cache & Refresh
        </button>
      </div>
      }
      
      <HeroSection />
      <ServiceCards />
      <FindProfessionals promotions={ptPromotions} />
      <FindClinics promotions={clinicPromotions} />
      <SponsoredContent products={sponsoredProducts} />
      <CallToAction />
    </>
  );
}

export default function Home() {
  return (
    <HomePageProvider>
      <HomeContent />
    </HomePageProvider>
  );
}
