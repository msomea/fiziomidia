import React, { useState } from "react";
import { toast } from "react-hot-toast";

const servicesList = [
  { title: "Physiotherapy Consultation", description: "Expert advice and treatment plans for your condition." },
  { title: "Rehabilitation Programs", description: "Structured rehabilitation to regain mobility and strength." },
  { title: "Home Visits", description: "Professional physiotherapy services at the comfort of your home." },
  { title: "Wellness Workshops", description: "Educational sessions to improve posture, strength, and flexibility." },
];

const About = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all fields!");
      return;
    }
    // TODO: Send form data to backend
    console.log(formData);
    toast.success("Message sent successfully!");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-alice mt-20">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">

        {/* About Us Section */}
        <section className="bg-white shadow-md rounded-2xl p-6 md:p-12">
          <h1 className="text-3xl font-bold text-caribbean mb-4">About Fiziomidia</h1>
          <p className="text-gray-700 mb-4">
            Fiziomidia is Tanzania’s leading platform connecting physiotherapists (PTs) with members
            seeking quality care, education, and wellness resources. Our mission is to improve access
            to professional physiotherapy services while supporting PTs to grow their practice.
          </p>
          <p className="text-gray-700">
            Through our platform, members can discover PTs, book appointments, join educational forums,
            and stay up-to-date with wellness tips. PTs can manage their profiles, appointments, promotions,
            and share knowledge with the community.
          </p>
        </section>

        {/* Services Section */}
        <section className="bg-white shadow-md rounded-2xl p-6 md:p-12">
          <h2 className="text-3xl font-bold text-caribbean mb-6">Our Services</h2>
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
          <h2 className="text-3xl font-bold text-caribbean mb-6">Contact Us</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="input input-bordered w-full"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
              className="input input-bordered w-full"
              required
            />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Your Message"
              className="textarea textarea-bordered w-full"
              rows={6}
              required
            />
            <div className="flex justify-end">
              <button type="submit" className="btn bg-caribbean text-white hover:bg-tufts">
                Send Message
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
};

export default About;
