import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Education = ({ formData, setFormData }) => {
  const [educationList, setEducationList] = useState(formData.education || []);
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    field: '',
    startYear: '',
    endYear: '',
    certificateUrl: ''
  });

  useEffect(() => {
    setEducationList(formData.education || []);
  }, [formData.education]);

  const handleNewEducationChange = (e) => {
    const { name, value } = e.target;
    setNewEducation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateYears = (start, end) => {
    if (!start) return false;
    if (!end) return true;
    return parseInt(start) <= parseInt(end);
  };

  const addEducation = () => {
    if (!newEducation.institution || !newEducation.degree || !newEducation.startYear) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newEducation.endYear && !validateYears(newEducation.startYear, newEducation.endYear)) {
      toast.error('End year must be after start year');
      return;
    }

    const updatedEducationList = [...educationList, newEducation];
    setEducationList(updatedEducationList);
    setFormData(prev => ({ ...prev, education: updatedEducationList }));

    setNewEducation({
      institution: '',
      degree: '',
      field: '',
      startYear: '',
      endYear: '',
      certificateUrl: ''
    });

    toast.success('Education entry added successfully');
  };

  const removeEducation = (index) => {
    const updatedEducationList = educationList.filter((_, i) => i !== index);
    setEducationList(updatedEducationList);
    setFormData(prev => ({ ...prev, education: updatedEducationList }));
    toast.success('Education entry removed');
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="card bg-white shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-caribbean">Education</h2>

      {/* Education List */}
      <div className="mb-6 space-y-4">
        {educationList.map((edu, index) => (
          <div key={index} className="flex items-start justify-between p-4 bg-alice rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-tufts">{edu.degree}</h3>
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm font-medium text-gray-700">{edu.institution}</p>
              <p className="text-sm text-gray-600">
                {edu.startYear}{edu.endYear ? ` - ${edu.endYear}` : ''}
              </p>
              {edu.field && <p className="text-sm text-gray-600">Field: {edu.field}</p>}
              {edu.certificateUrl && (
                <a
                  href={edu.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-caribbean hover:text-tufts mt-2 inline-block"
                >
                  View Certificate
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Education */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="institution"
            value={newEducation.institution}
            onChange={handleNewEducationChange}
            placeholder="Institution Name *"
            className="input input-bordered w-full text-sm"
          />
          <input
            type="text"
            name="degree"
            value={newEducation.degree}
            onChange={handleNewEducationChange}
            placeholder="Degree/Certificate Title *"
            className="input input-bordered w-full text-sm"
          />
          <input
            type="text"
            name="field"
            value={newEducation.field}
            onChange={handleNewEducationChange}
            placeholder="Field of Study"
            className="input input-bordered w-full text-sm"
          />
          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <select
              name="startYear"
              value={newEducation.startYear}
              onChange={handleNewEducationChange}
              className="select select-bordered w-full text-sm"
            >
              <option value="">Start Year *</option>
              {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select
              name="endYear"
              value={newEducation.endYear}
              onChange={handleNewEducationChange}
              className="select select-bordered w-full text-sm"
            >
              <option value="">End Year</option>
              {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <input
            type="url"
            name="certificateUrl"
            value={newEducation.certificateUrl}
            onChange={handleNewEducationChange}
            placeholder="Certificate URL (if available)"
            className="input input-bordered w-full text-sm md:col-span-2"
          />
        </div>

        <button
          type="button"
          onClick={addEducation}
          className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Education
        </button>
      </div>
    </div>
  );
};

export default Education;
