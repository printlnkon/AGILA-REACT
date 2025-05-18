import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <a href="/" className="flex items-center mb-4">
              <img src="/assets/images/eagle_head_white.svg" alt="LOGO" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-white">AGILA</span>
            </a>
            <div className="h-1 w-16 bg-blue-600 mb-4"></div>
            <p className="mb-6">AGILA - Empowering smarter education through AI innovation.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="ri-twitter-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="ri-instagram-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="ri-github-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="ri-dribbble-fill text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h5 className="text-xl font-semibold text-white mb-4">ABOUT</h5>
            <div className="h-1 w-16 bg-blue-600 mb-4"></div>
            <p>AGILA automates, secures, and transforms attendance monitoring into a smarter, faster, and more reliable system for education.</p>
          </div>
          
          <div>
            <h5 className="text-xl font-semibold text-white mb-4">CONTACT</h5>
            <div className="h-1 w-16 bg-blue-600 mb-4"></div>
            <ul className="space-y-3">
              <li>109 Samson Rd, Caloocan, 1400 Metro Manila</li>
              <li>(02) 8294-4001</li>
              <li>www.sti.edu/</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between">
            <p className="mb-4 md:mb-0">© Copyright AGILA. All Rights Reserved</p>
            <p>Designed &amp; Developed by <a href="#" className="text-blue-400 hover:text-blue-300">AGILA Team</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;