import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const Services = ({ formData, setFormData }) => {
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
      toast.error('Please fill in all service details');
      return;
    }
    if (isNaN(newService.duration)) {
      toast.error('Duration must be a number');
      return;
    }
    if (isNaN(newService.price)) {
      toast.error('Price must be a number');
      return;
    }

    const updatedServices = [...services, newService];
    setServices(updatedServices);
    setFormData(prev => ({ ...prev, services: updatedServices }));

    setNewService({ name: '', description: '', duration: '', price: '' });
    toast.success('Service added successfully');
  };

  const removeService = (index) => {
    const updatedServices = services.filter((_, i) => i !== index);
    setServices(updatedServices);
    setFormData(prev => ({ ...prev, services: updatedServices }));
    toast.success('Service removed');
  };

  return (
    <div className="card bg-white shadow-md p-6">

      {/* HEADER */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">Services</h2>
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
                    <span>{service.duration} minutes</span>
                    <span>Tsh {service.price}</span>
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
                placeholder="Service Name"
                className="input input-bordered w-full text-sm"
              />
              <input
                type="number"
                name="duration"
                value={newService.duration}
                onChange={handleNewServiceChange}
                placeholder="Duration (minutes)"
                className="input input-bordered w-full text-sm"
              />
              <input
                type="number"
                name="price"
                value={newService.price}
                onChange={handleNewServiceChange}
                placeholder="Price (Tsh)"
                className="input input-bordered w-full text-sm"
              />
              <textarea
                name="description"
                value={newService.description}
                onChange={handleNewServiceChange}
                placeholder="Service Description"
                className="input input-bordered w-full text-sm md:col-span-2"
              />
            </div>

            <button
              type="button"
              onClick={addService}
              className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Service
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default Services;
