import React from 'react';

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-blue-700">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16" data-aos="fade-down" data-aos-delay="150">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-white">Get in touch</h1>
          <div className="h-1 w-20 bg-white mx-auto mb-5"></div>
          <p className="max-w-2xl mx-auto text-blue-100">
            We would love to hear from you.
            For inquiries, feedback, or support regarding AGILA, feel free to send us a message.
          </p>
        </div>
        
        <div className="flex justify-center" data-aos="fade-down" data-aos-delay="250">
          <div className="w-full max-w-4xl">
            <form className="bg-white p-8 rounded-lg shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="First name"
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Last name"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <input 
                  type="email" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="example@email.com"
                />
              </div>
              
              <div className="mb-6">
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Subject"
                />
              </div>
              
              <div className="mb-6">
                <textarea 
                  rows="5" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Message"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;