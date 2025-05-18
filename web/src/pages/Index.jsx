import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Navbar from '@/features/Index/components/Navbar';
import Hero from '@/features/Index/components/Hero';
import About from '@/features/Index/components/About';
import Counter from '@/features/Index/components/Counter';
import Team from '@/features/Index/components/Team';
import Contact from '@/features/Index/components/Contact';
import Footer from '@/features/Index/components/Footer';
import { refreshBehavior } from '@/features/Index/index.js';

function Index() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 120,
      delay: 0,
      once: false,
      mirror: false,
      easing: 'ease-in-out',
    });

    refreshBehavior();

  }, []);

  return (
    <div className="font-sans">
      <Navbar />
      <Hero />
      <About />
      <Counter />
      <Team />
      <Contact />
      <Footer />
    </div>
  );
}

export default Index;