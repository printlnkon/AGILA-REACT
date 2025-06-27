import { MonitorSmartphone, Database, UserPlus, Shield } from "lucide-react";

export default function About() {
  return (
    <>
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div
            className="text-center mb-12"
            data-aos="fade-down"
            data-aos-delay="50"
          >
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 ">About</h1>
            <div className="h-1 w-20 bg-blue-900 mx-auto mb-5"></div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10" data-aos="fade-up">
              <h2 className="text-3xl font-bold mb-4">Key Features</h2>
              <p className="text-gray-600 max-w-3xl mx-auto mb-10">
                AGILA redefines the future of attendance at STI College
                Caloocan. Through the power of artificial intelligence, we
                deliver smarter, faster, and more secure solutions for tracking
                teacher and student attendance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div
                className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                <div className="bg-blue-900 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">
                  Smart Attendance
                </h3>
                <p className="text-gray-600 text-center">
                  Automated and secure facial recognition attendance tracking
                  with real-time reporting.
                </p>
              </div>

              {/* Feature 2 */}
              <div
                className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <div className="bg-blue-900 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <Database size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">
                  Instant Data Reporting
                </h3>
                <p className="text-gray-600 text-center">
                  Generates attendance reports instantly for students, teachers,
                  and administrators.
                </p>
              </div>

              {/* Feature 3 */}
              <div
                className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <div className="bg-blue-900 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <MonitorSmartphone size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">
                  Multi-Device Access
                </h3>
                <p className="text-gray-600 text-center">
                  Accessible across mobile phones, tablets, and desktops for
                  real-time monitoring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
