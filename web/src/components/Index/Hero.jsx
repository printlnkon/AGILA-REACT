import { Link } from "react-router-dom";
import { Link as Path } from "react-scroll";
import { CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[88vh] flex items-center overflow-hidden bg-gradient-to-b from-blue-50 to-blue-200"
    >
      {/* Decorative gradients */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 bg-blue-300/40 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 bg-indigo-300/40 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Content */}
          <div data-aos="fade-up">
            <span className="inline-flex items-center text-xs font-medium bg-white text-blue-900 px-3 py-1 rounded-full shadow-sm">
              AI-Powered Attendance • STI Caloocan
            </span>
            <h1 className="mt-4 text-blue-900 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              Seamless, secure attendance for teachers and students
            </h1>
            <p className="mt-4 text-gray-700 text-lg">
              Face recognition. Instant reports. Real-time monitoring across
              devices.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "Smart facial recognition with high accuracy",
                "Instant reporting for admins, teachers, and students",
                "Works across mobile, tablet, and desktop",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="text-blue-700 mt-1 flex-shrink-0" />
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 hover:-translate-y-0.5 shadow-lg"
              >
                Get Started
              </Link>
              <Path
                to="about"
                smooth={true}
                offset={-70}
                duration={500}
                className="inline-block px-6 py-3 bg-white text-blue-900 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer"
              >
                See features
              </Path>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative" data-aos="fade-left" data-aos-delay="100">
            <div className="aspect-[4/3] md:aspect-[5/4] w-full rounded-2xl bg-white shadow-xl border border-blue-100 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-blue-100 via-indigo-100 to-white flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-blue-600/10 flex items-center justify-center">
                    <img
                      src="/assets/images/eagle_head_black.svg"
                      alt="AGILA"
                      className="h-7 w-7 opacity-80"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Preview panel. Replace with a product screenshot later.
                  </p>
                </div>
              </div>
            </div>
            {/* Glow */}
            <div className="absolute -z-10 inset-0 m-auto h-64 w-64 bg-blue-400/30 blur-3xl rounded-full" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <Path
          to="about"
          smooth={true}
          offset={-70}
          duration={500}
          className="cursor-pointer inline-flex flex-col items-center text-blue-900/70 hover:text-blue-900"
        >
          <span className="text-xs">Scroll</span>
          <span className="mt-1 h-5 w-5 rounded-full border border-current animate-bounce" />
        </Path>
      </div>
    </section>
  );
}
