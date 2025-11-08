import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Services = ({ formData, setFormData }) => {
  const [services, setServices] = useState(formData.services || []);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: '',
    price: ''
  });

  useEffect(() => {
    setServices(formData.services || []);
  }, [formData.services]);

  const handleNewServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addService = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newService.name || !newService.description || !newService.duration || !newService.price) {
      toast.error('Please fill in all service details');
      return;
    }

    // Validate duration is a number
    if (isNaN(newService.duration)) {
      toast.error('Duration must be a number');
      return;
    }

    // Validate price is a number
    if (isNaN(newService.price)) {
      toast.error('Price must be a number');
      return;
    }

    const updatedServices = [...services, newService];
    setServices(updatedServices);
    setFormData(prev => ({ ...prev, services: updatedServices }));
    
    // Reset form
    setNewService({
      name: '',
      description: '',
      duration: '',
      price: ''
    });
    
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
      <h2 className="text-xl font-bold mb-4 text-caribbean">Services</h2>
      
      {/* Service List */}
      <div className="mb-6 space-y-4">
        {services.map((service, index) => (
          <div key={index} className="flex items-start justify-between p-4 bg-alice rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-tufts">{service.name}</h3>
                <button
                  onClick={() => removeService(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>{service.duration} minutes</span>
                <span>${service.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Service Form */}
      <form onSubmit={addService} className="space-y-4">
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
            placeholder="Price ($)"
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
          type="submit"
          className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Service
        </button>
      </form>
    </div>
  );
};

export default Services;