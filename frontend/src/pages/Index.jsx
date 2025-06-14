import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Navbar from "@/components/Index/NavBar";
import Hero from "@/components/Index/Hero";
import About from "@/components/Index/About";
import Contact from "@/components/Index/Contact";
import Footer from "@/components/Index/Footer";
import refreshPageBehavior from "@/components/refreshPageBehavior.js";

export default function Index() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 120,
      delay: 0,
      once: false,
      mirror: false,
      easing: "ease-in-out",
    });
    refreshPageBehavior();
  }, []);

  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Contact />
      <Footer />
    </>
  );
}
