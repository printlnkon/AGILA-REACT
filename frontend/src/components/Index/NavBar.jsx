import React, { useState } from "react";
import { Link as Path } from "react-scroll";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center">
              <img
                src="/assets/images/eagle_head_black.svg"
                alt="LOGO"
                className="h-8 w-auto"
              />
              <span className="ml-2 text-xl font-bold">AGILA</span>
            </a>

            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-500 focus:outline-none"
              >
                <Menu />
              </button>
            </div>

            <div
              className={`md:flex items-center ${
                isOpen
                  ? "block absolute top-16 left-0 right-0 bg-white shadow-md p-4"
                  : "hidden"
              } md:static md:shadow-none`}
            >
              <ul className="md:flex space-y-3 md:space-y-0 md:space-x-6">
                <li>
                  <Path
                    to="hero"
                    spy={true}
                    smooth={true}
                    offset={-70}
                    duration={500}
                    className="text-gray-700 hover:text-blue-700 cursor-pointer"
                  >
                    Home
                  </Path>
                </li>
                <li>
                  <Path
                    spy={true}
                    smooth={true}
                    to="about"
                    offset={-70}
                    duration={500}
                    className="text-gray-700 hover:text-blue-700 cursor-pointer"
                  >
                    About
                  </Path>
                </li>
                <li>
                  <Path
                    spy={true}
                    smooth={true}
                    to="contact"
                    offset={-70}
                    duration={500}
                    className="text-gray-700 hover:text-blue-700 cursor-pointer"
                  >
                    Contact
                  </Path>
                </li>
              </ul>
              <Link
                to="/login"
                className="md:ml-6 mt-3 md:mt-0 block px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 transition cursor-pointer"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
