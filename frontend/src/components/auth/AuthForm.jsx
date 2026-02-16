import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AuthForm({ onSubmit, titleKey, fields, buttonLabelKey }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl text-caribbean font-bold mb-6 text-center">
          {t(titleKey)}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ name, labelKey, type, placeholderKey }) => (
            <div key={name}>
              <label className="text-gray-700 block mb-1">
                {t(labelKey)}
              </label>

              <input
                type={type}
                name={name}
                placeholder={placeholderKey ? t(placeholderKey) : ""}
                required
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-100 border border-gray-300 focus:outline-none focus:border-caribbean text-gray-900"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full py-2 bg-caribbean hover:bg-tufts rounded font-semibold text-white"
          >
            {t(buttonLabelKey)}
          </button>
        </form>
      </div>
    </div>
  );
}
