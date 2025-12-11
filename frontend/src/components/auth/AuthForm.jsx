import { useState } from "react";

export default function AuthForm({ onSubmit, title, fields, buttonLabel }) {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-white">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl text-caribbean font-bold mb-6 text-center">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="text-gray-700 block mb-1">{label}</label>
              <input
                type={type}
                name={name}
                placeholder={placeholder || ""}
                required
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-300 border border-gray-600 focus:outline-none focus:border-caribbean"
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full py-2 bg-caribbean hover:bg-tufts rounded font-semibold"
          >
            {buttonLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
