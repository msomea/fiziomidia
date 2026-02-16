import { Stethoscope, GraduationCap, Users, Target, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ServiceCards() {
  const { t } = useTranslation();

  const services = [
    {
      title: t("appointment_system"),
      icon: <Stethoscope size={32} className="text-caribbean" />,
      desc: t("appointment_desc"),
    },
    {
      title: t("educational_resources"),
      icon: <GraduationCap size={32} className="text-tufts" />,
      desc: t("educational_resources_desc"),
    },
    {
      title: t("community_forum"),
      icon: <Users size={32} className="text-caribbean" />,
      desc: t("community_forum_desc"),
    },
    {
      title: t("product_promotion"),
      icon: <Target size={32} className="text-tufts" />,
      desc: t("product_promotion_desc"),
    },
    {
      title: t("instant_messaging"),
      icon: <MessageCircle size={32} className="text-caribbean" />,
      desc: t("instant_messaging_desc"),
    },
  ];

  return (
    <section className="py-12 bg-white" id="services">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
          {t("everything_you_need")}<span className="text-caribbean"> {t("Physiotherapy")} </span>
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
