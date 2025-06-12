export default function Footer() {
  return (
    <>
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 pt-6 pb-6">
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between">
              <p className="mb-4 md:mb-0">
                © Copyright AGILA. All Rights Reserved
              </p>
              <p>
                Designed &amp; Developed by{" "}
                <a className="text-blue-400 hover:text-blue-300">
                  AGILA Team
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
