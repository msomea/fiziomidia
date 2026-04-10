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
    loading, 
    error, 
    fetchHomePageData,
    forceRefreshHomePage 
  } = useHomePage();

  useEffect(() => {
    fetchHomePageData();
  }, []); // Empty dependency array - only run once on mount

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-caribbean"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>Error loading home page: {error}</p>
        </div>
      </div>
    );
  }

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
