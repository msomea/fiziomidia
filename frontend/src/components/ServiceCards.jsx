import { Stethoscope, GraduationCap, Users } from "lucide-react";

export default function ServiceCards() {
  const services = [
    {
      title: "Book Physiotherapy",
      icon: <Stethoscope size={32} className="text-caribbean" />,
      desc: "Schedule physiotherapy sessions with verified professionals anywhere in Tanzania.",
    },
    {
      title: "Learn & Grow",
      icon: <GraduationCap size={32} className="text-tufts" />,
      desc: "Access educational resources and workshops to enhance your professional skills.",
    },
    {
      title: "Join the Community",
      icon: <Users size={32} className="text-caribbean" />,
      desc: "Engage with other physiotherapists and clients through FizioMidia’s interactive forum.",
    },
  ];

  return (
    <section className="py-12 bg-white" id="services">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
          Our <span className="text-caribbean">Services</span>
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <div
              key={index}
              className="card bg-alice shadow-md border border-gray-100 hover:shadow-xl transition"
            >
              <div className="card-body items-center text-center">
                <div className="mb-3">{service.icon}</div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
