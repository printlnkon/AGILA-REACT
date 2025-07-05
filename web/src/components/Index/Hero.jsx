import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <>
      <section
        id="hero"
        className="relative min-h-screen flex items-center text-center overflow-hidden bg-gradient-to-b from-blue-50 to-blue-200"
      >
        {/* Hero Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <h1
                data-aos="fade-left"
                className="text-blue-900 text-5xl md:text-6xl lg:text-7xl font-bold uppercase"
              >
                Welcome to AGILA
              </h1>
              <h5
                data-aos="fade-right"
                className="text-yellow-500 mt-3 mb-6 text-xl md:text-xl max-w-3xl mx-auto "
              >
                An AI-Guided Identification and Logging Classroom Attendance
                Monitoring of Teachers and Students
              </h5>
              <div data-aos="fade-up" data-aos-delay="50" className="mt-6">
                <Link
                  to="/login"
                  className="inline-block px-6 py-3 mr-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
