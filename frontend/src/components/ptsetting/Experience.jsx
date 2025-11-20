import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Experience = ({ formData, setFormData }) => {
  const [experiences, setExperiences] = useState(formData.experience || []);
  const [newExperience, setNewExperience] = useState({
    position: '',
    company: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });

  useEffect(() => {
    setExperiences(formData.experience || []);
  }, [formData.experience]);

  const handleNewExperienceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewExperience(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'current' && checked) {
      setNewExperience(prev => ({ ...prev, endDate: '' }));
    }
  };

  const validateDates = (start, end) => {
    if (!start) return false;
    if (!end) return true;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return startDate <= endDate;
  };

  const addExperience = () => {
    // Validate required fields
    if (!newExperience.position || !newExperience.company || !newExperience.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate dates
    if (!validateDates(newExperience.startDate, newExperience.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    const updatedExperiences = [...experiences, newExperience];
    setExperiences(updatedExperiences);
    setFormData(prev => ({ ...prev, experience: updatedExperiences }));

    setNewExperience({
      position: '',
      company: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    });

    toast.success('Experience added successfully');
  };

  const removeExperience = (index) => {
    const updatedExperiences = experiences.filter((_, i) => i !== index);
    setExperiences(updatedExperiences);
    setFormData(prev => ({ ...prev, experience: updatedExperiences }));
    toast.success('Experience removed');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-caribbean">Experience</h2>

      {/* Experience List */}
      <div className="mb-6 space-y-4">
        {experiences.map((exp, index) => (
          <div key={index} className="flex items-start justify-between p-4 bg-alice rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-tufts">{exp.position}</h3>
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm font-medium text-gray-700">{exp.company}</p>
              <p className="text-sm text-gray-600">
                {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
              </p>
              <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Experience */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="position"
            value={newExperience.position}
            onChange={handleNewExperienceChange}
            placeholder="Position/Title *"
            className="input input-bordered w-full text-sm"
          />
          <input
            type="text"
            name="company"
            value={newExperience.company}
            onChange={handleNewExperienceChange}
            placeholder="Company/Clinic Name *"
            className="input input-bordered w-full text-sm"
          />
          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <input
              type="month"
              name="startDate"
              value={newExperience.startDate}
              onChange={handleNewExperienceChange}
              className="input input-bordered w-full text-sm"
            />
            <input
              type="month"
              name="endDate"
              value={newExperience.endDate}
              onChange={handleNewExperienceChange}
              className="input input-bordered w-full text-sm"
              disabled={newExperience.current}
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              name="current"
              checked={newExperience.current}
              onChange={handleNewExperienceChange}
              className="checkbox checkbox-sm"
            />
            <label className="text-sm text-gray-600">I currently work here</label>
          </div>
          <textarea
            name="description"
            value={newExperience.description}
            onChange={handleNewExperienceChange}
            placeholder="Description of your roles and achievements"
            className="textarea textarea-bordered w-full text-sm md:col-span-2 h-24"
          />
        </div>

        <button
          type="button" // <-- changed from submit
          onClick={addExperience} // <-- manually call handler
          className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Experience
        </button>
      </div>
    </div>
  );
};

export default Experience;
