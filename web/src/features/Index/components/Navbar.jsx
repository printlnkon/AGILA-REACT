import React, { useState } from 'react';
import { Link } from 'react-scroll';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <a href="/" className="flex items-center">
            <img src="/assets/images/eagle_head_black.svg" alt="LOGO" className="h-8 w-auto" />
            <span className="ml-2 text-xl font-bold">AGILA</span>
          </a>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          <div className={`md:flex items-center ${isOpen ? 'block absolute top-16 left-0 right-0 bg-white shadow-md p-4' : 'hidden'} md:static md:shadow-none`}>
            <ul className="md:flex space-y-3 md:space-y-0 md:space-x-6">
              <li>
                <Link to="hero" spy={true} smooth={true} offset={-70} duration={500} className="text-gray-700 hover:text-blue-700 cursor-pointer">Home</Link>
              </li>
              <li>
                <Link to="about" spy={true} smooth={true} offset={-70} duration={500} className="text-gray-700 hover:text-blue-700 cursor-pointer">About</Link>
              </li>
              <li>
                <Link to="team" spy={true} smooth={true} offset={-70} duration={500} className="text-gray-700 hover:text-blue-700 cursor-pointer">Team</Link>
              </li>
              <li>
                <Link to="contact" spy={true} smooth={true} offset={-70} duration={500} className="text-gray-700 hover:text-blue-700 cursor-pointer">Contact</Link>
              </li>
            </ul>
            <a href="/login" className="md:ml-6 mt-3 md:mt-0 block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Log in</a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;