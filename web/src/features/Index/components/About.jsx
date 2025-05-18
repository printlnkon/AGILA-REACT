import person1 from '@/assets/images/person-1.jpg';

const About = () => {
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16" data-aos="fade-down" data-aos-delay="50">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4">About us</h1>
          <div className="h-1 w-20 bg-blue-600 mx-auto mb-5"></div>
          <p className="max-w-2xl mx-auto text-gray-600">
            Inspired by our dreams and vision, we strive to soar high by delivering secure, accurate, and efficient attendance tracking through modern technology.
            It reflects our commitment to innovation and excellence, ensuring that every learning environment is smarter and more seamless.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="lg:w-1/2" data-aos="fade-down" data-aos-delay="50">
            <img src={person1} alt="About AGILA" className="rounded-md shadow-lg w-full" />
          </div>
          
          <div className="lg:w-5/12" data-aos="fade-down" data-aos-delay="150">
            <h1 className="text-3xl font-bold mb-3">About AGILA</h1>
            <p className="text-gray-600 mb-8">
              AGILA redefines the future of attendance at STI College Caloocan.
              Through the power of artificial intelligence, we deliver smarter, faster, and more secure solutions for tracking teacher and student attendance.
            </p>
            
            <div className="flex mb-6">
              <div className="flex-shrink-0 bg-blue-600 text-white p-4 rounded-lg mr-4">
                <i className="ri-user-add-fill text-2xl"></i>
              </div>
              <div>
                <h5 className="text-xl font-semibold mb-2">Smart Attendance</h5>
                <p className="text-gray-600">Automated and secure facial recognition attendance tracking with real-time reporting.</p>
              </div>
            </div>
            
            <div className="flex mb-6">
              <div className="flex-shrink-0 bg-blue-600 text-white p-4 rounded-lg mr-4">
                <i className="ri-loader-2-line text-2xl"></i>
              </div>
              <div>
                <h5 className="text-xl font-semibold mb-2">Instant Data Reporting</h5>
                <p className="text-gray-600">Generates attendance reports instantly for students, teachers, and administrator.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 bg-blue-600 text-white p-4 rounded-lg mr-4">
                <i className="ri-device-fill text-2xl"></i>
              </div>
              <div>
                <h5 className="text-xl font-semibold mb-2">Multi-Device Access</h5>
                <p className="text-gray-600">Accessible across mobile phones, tablets, and desktops for real-time monitoring.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;