const Hero = () => {
  return (
    <section id="hero" className="bg-blue-50 min-h-screen flex items-center text-center">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="w-full">
            <h1 
              data-aos="fade-left" 
              className="text-[#0048A7] text-5xl md:text-6xl lg:text-7xl font-semibold uppercase"
            >
              Welcome to AGILA
            </h1>
            <h5 
              data-aos="fade-right" 
              className="text-[#DE960F] mt-3 mb-4 text-lg md:text-xl"
            >
              AGILA - AI Guided Identification and Logging Attendance for Classrooms at STI College Caloocan
            </h5>
            <div data-aos="fade-up" data-aos-delay="50">
              <a href="#" className="inline-block px-5 py-3 mr-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition">App Store</a>
              <a href="#" className="inline-block px-5 py-3 ml-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition">Google Play</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;