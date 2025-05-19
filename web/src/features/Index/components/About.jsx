import person1 from '@/assets/images/person-1.jpg';
import { MonitorSmartphone, Database, UserPlus} from 'lucide-react';

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
        
        {/* Center everything with max-widths */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
          <div className="w-full lg:w-2/5 max-w-md" data-aos="fade-down" data-aos-delay="50">
            <img src={person1} alt="About AGILA" className="rounded-md shadow-lg w-full" />
          </div>
          
          <div className="w-full lg:w-2/5 max-w-md" data-aos="fade-down" data-aos-delay="150">
            <h1 className="text-3xl font-bold mb-3">AGILA</h1>
            <p className="text-gray-600 mb-8">
              AGILA redefines the future of attendance at STI College Caloocan.
              Through the power of artificial intelligence, we deliver smarter, faster, and more secure solutions for tracking teacher and student attendance.
            </p>
            
            <div className="flex mb-6">
              <div className="flex-shrink-0 bg-blue-600 text-white p-4 rounded-lg mr-4 flex items-center justify-center w-14 h-14">
                <UserPlus size={30} />
              </div>
              <div>
                <h5 className="text-xl font-semibold mb-2">Smart Attendance</h5>
                <p className="text-gray-600">Automated and secure facial recognition attendance tracking with real-time reporting.</p>
              </div>
            </div>
            
            <div className="flex mb-6">
              <div className="flex-shrink-0 bg-blue-600 text-white p-4 rounded-lg mr-4 flex items-center justify-center w-14 h-14">
                <Database size={30} />
              </div>
              <div>
                <h5 className="text-xl font-semibold mb-2">Instant Data Reporting</h5>
                <p className="text-gray-600">Generates attendance reports instantly for students, teachers, and administrator.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 bg-blue-600 text-white p-4 rounded-lg mr-4 flex items-center justify-center w-14 h-14">
                <MonitorSmartphone size={30} />
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