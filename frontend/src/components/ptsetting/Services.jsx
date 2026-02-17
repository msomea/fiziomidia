import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Services = ({ formData, setFormData }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState(formData.services || []);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: '',
    price: ''
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setServices(formData.services || []);
  }, [formData.services]);

  const handleNewServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: value }));
  };

  const addService = () => {
    if (!newService.name || !newService.description || !newService.duration || !newService.price) {
      toast.error(t('fill_all_service_fields'));
      return;
    }
    if (isNaN(newService.duration)) {
      toast.error(t('duration_must_be_number'));
      return;
    }
    if (isNaN(newService.price)) {
      toast.error(t('price_must_be_number'));
      return;
    }

    const updatedServices = [...services, newService];
    setServices(updatedServices);
    setFormData(prev => ({ ...prev, services: updatedServices }));
    setNewService({ name: '', description: '', duration: '', price: '' });
    toast.success(t('service_added'));
  };

  const removeService = (index) => {
    const updatedServices = services.filter((_, i) => i !== index);
    setServices(updatedServices);
    setFormData(prev => ({ ...prev, services: updatedServices }));
    toast.success(t('service_removed'));
  };

  return (
    <div className="card bg-white shadow-md p-6">

      {/* HEADER */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">{t('services')}</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* COLLAPSIBLE BODY */}
      {isOpen && (
        <div className="mt-4">

          {/* Service List */}
          <div className="mb-6 space-y-4">
            {services.map((service, index) => (
              <div key={service.name || index} className="flex items-start justify-between p-4 bg-alice rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-tufts">{service.name}</h3>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{service.duration} {t('minutes')}</span>
                    <span>{t('currency')} {service.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Service */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                value={newService.name}
                onChange={handleNewServiceChange}
                placeholder={t('service_name')}
                className="input input-bordered w-full text-sm"
              />
              <input
                type="number"
                name="duration"
                value={newService.duration}
                onChange={handleNewServiceChange}
                placeholder={t('duration_placeholder')}
                className="input input-bordered w-full text-sm"
              />
              <input
                type="number"
                name="price"
                value={newService.price}
                onChange={handleNewServiceChange}
                placeholder={t('price_placeholder')}
                className="input input-bordered w-full text-sm"
              />
              <textarea
                name="description"
                value={newService.description}
                onChange={handleNewServiceChange}
                placeholder={t('service_description')}
                className="input input-bordered w-full text-sm md:col-span-2"
              />
            </div>

            <button
              type="button"
              onClick={addService}
              className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {t('add_service')}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default Services;
