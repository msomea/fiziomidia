import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import { API_URL } from "../config/constants";

const About = () => {
  const { t } = useTranslation();
  
  const servicesList = [
    { title: t("physiotherapy_consultation"), description: t("consultation_desc") },
    { title: t("rehabilitation_programs"), description: t("rehab_desc") },
    { title: t("home_visits"), description: t("home_visits_desc") },
    { title: t("wellness_workshops"), description: t("workshops_desc") },
  ];

  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t("fill_all_fields"));
      return;
    }
    
    setLoading(true);
    try {
      // Send form data to backend - adjust endpoint as needed
      await API.post(`${API_URL}/contact`, formData);
      toast.success(t("message_sent_success"));
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error(err.response?.data?.error || t("message_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-alice mt-20">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">

        {/* About Us Section */}
        <section className="bg-white shadow-md rounded-2xl p-6 md:p-12">
          <h1 className="text-3xl font-bold text-caribbean mb-4">{t("about_fiziomidia")}</h1>
          <p className="text-gray-700 mb-4">
            {t("about_desc_1")}
          </p>
          <p className="text-gray-700">
            {t("about_desc_2")}
          </p>
        </section>

        {/* Services Section */}
        <section className="bg-white shadow-md rounded-2xl p-6 md:p-12">
          <h2 className="text-3xl font-bold text-caribbean mb-6">{t("our_services")}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {servicesList.map((service, idx) => (
              <div
                key={idx}
                className="bg-alice rounded-2xl shadow p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <h3 className="text-xl font-semibold text-tufts mb-2">{service.title}</h3>
                <p className="text-gray-700">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-white shadow-md rounded-2xl p-6 md:p-12">
          <h2 className="text-3xl font-bold text-caribbean mb-6">{t("contact_us")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t("your_name")}
              className="input input-bordered w-full"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t("your_email")}
              className="input input-bordered w-full"
              required
            />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={t("your_message")}
              className="textarea textarea-bordered w-full"
              rows={6}
              required
            />
            <div className="flex justify-end">
              <button type="submit" className="btn bg-caribbean text-white p-1 hover:bg-tufts" disabled={loading}>
                {loading ? t("sending") : t("send_message")}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
};

export default About;
