import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Navbar from "@/components/Index/NavBar";
import Hero from "@/components/Index/Hero";
import About from "@/components/Index/About";
import Contact from "@/components/Index/Contact";
import Footer from "@/components/Index/Footer";
import refreshPageBehavior from "@/utils/refreshPageBehavior.js";
import { ArrowUp } from "lucide-react";

export default function HomePage() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 600,
      offset: 120,
      delay: 0,
      once: false, // Changed from true to false to allow animations to replay
      mirror: false,
      easing: "ease-out",
    });

    // Function to handle scroll events
    const handleScroll = () => {
      // Show back to top button when scrolled past 500px
      setShowBackToTop(window.scrollY > 500);

      // Refresh AOS on scroll to reset animations
      AOS.refresh();
    };

    window.addEventListener("scroll", handleScroll);
    refreshPageBehavior();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Contact />
      <Footer />

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`cursor-pointer fixed bottom-6 right-6 p-3 bg-blue-900 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 ${
          showBackToTop ? "opacity-100 scale-100" : "opacity-0 scale-0"
        }`}
        aria-label="Back to top"
      >
        <ArrowUp size={20} />
      </button>
    </>
  );
}
