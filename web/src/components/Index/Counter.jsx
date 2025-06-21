export default function Counter() {
  return (
    <>
      <section id="counter" className="py-20 bg-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
            <div
              className="col-span-2"
              data-aos="fade-down"
              data-aos-delay="150"
            >
              <h1 className="text-5xl font-bold mb-2">90,000+</h1>
              <h6 className="text-lg uppercase mt-3">Total Downloads</h6>
            </div>
            <div
              className="col-span-2"
              data-aos="fade-down"
              data-aos-delay="450"
            >
              <h1 className="text-5xl font-bold mb-2">4</h1>
              <h6 className="text-lg uppercase mt-3">Team Members</h6>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
