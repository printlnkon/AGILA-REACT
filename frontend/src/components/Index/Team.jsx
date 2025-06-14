import person1 from "@/assets/images/person-1.jpg";

export default function Team() {
  const TeamMember = ({ image, name, role, delay }) => (
    <div className="col-span-1" data-aos="fade-down" data-aos-delay={delay}>
      <div className="bg-blue-700 rounded-lg overflow-hidden group relative h-80">
        <div className="overflow-hidden h-full">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-blue-700 bg-opacity-80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h4 className="text-white text-xl font-semibold">{name}</h4>
          <p className="text-blue-100">{role}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section id="team" className="py-20">
        <div className="container mx-auto px-4">
          <div
            className="text-center mb-16"
            data-aos="fade-down"
            data-aos-delay="150"
          >
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">
              Meet The Team
            </h1>
            <div className="h-1 w-20 bg-blue-600 mx-auto mb-5"></div>
            <p className="max-w-2xl mx-auto text-gray-600">
              A dedicated team of student developers committed to creating
              smarter, faster, and more secure solutions for the future of
              education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <TeamMember
              image={person1}
              name="Kalfontein T. Cruz"
              role="Lead Programmer"
              delay="150"
            />
            <TeamMember
              image={person1}
              name="Roel B. Maximo"
              role="Documentator"
              delay="250"
            />
            <TeamMember
              image={person1}
              name="Solito G. Moreno Jr."
              role="Programmer"
              delay="350"
            />
            <TeamMember
              image={person1}
              name="John Gabriel P. Purification"
              role="Designer"
              delay="350"
            />
          </div>
        </div>
      </section>
    </>
  );
}
