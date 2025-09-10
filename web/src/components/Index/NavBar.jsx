import { useEffect, useState } from "react";
import { Link as Path } from "react-scroll";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);

  const baseNavLink =
    "relative pb-1 text-gray-700 hover:text-blue-700 cursor-pointer " +
    "after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-full " +
    "after:origin-left after:scale-x-0 after:bg-blue-900 after:transition-transform " +
    "after:duration-300 hover:after:scale-x-100";

  const activeNavLink = "text-blue-900 font-semibold after:scale-x-100";

  return (
    <nav
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? "bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm"
          : "bg-white/70 backdrop-blur"
      }`}
      role="navigation"
      aria-label="Main"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* logo */}
          <a href="/" className="flex items-center">
            <img
              src="src/assets/images/AGILA_A.svg"
              alt="AGILA LOGO"
              className="h-12 w-auto"
              loading="lazy"
            />
            {/* logo text */}
            <span className="mt-2 text-2xl font-bold text-blue-900">GILA</span>
          </a>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="text-gray-700 focus:outline-none p-2 rounded hover:bg-gray-100"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>

          <div
            className={`md:flex items-center ${
              isOpen
                ? "block absolute top-16 left-0 right-0 bg-white shadow-md p-4"
                : "hidden"
            } md:static md:shadow-none md:bg-transparent`}
          >
            <ul className="md:flex space-y-3 md:space-y-0 md:space-x-6">
              <li>
                <Path
                  to="hero"
                  spy={true}
                  smooth={true}
                  offset={-70}
                  duration={500}
                  activeClass={activeNavLink}
                  className={baseNavLink}
                  onClick={closeMenu}
                >
                  Home
                </Path>
              </li>
              <li>
                <Path
                  to="about"
                  spy={true}
                  smooth={true}
                  offset={-70}
                  duration={500}
                  activeClass={activeNavLink}
                  className={baseNavLink}
                  onClick={closeMenu}
                >
                  About
                </Path>
              </li>
              <li>
                <Path
                  to="contact"
                  spy={true}
                  smooth={true}
                  offset={-70}
                  duration={500}
                  activeClass={activeNavLink}
                  className={baseNavLink}
                  onClick={closeMenu}
                >
                  Contact
                </Path>
              </li>
            </ul>
            <Link
              to="/login"
              className="md:ml-6 mt-3 md:mt-0 block px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 transition cursor-pointer"
              onClick={closeMenu}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
