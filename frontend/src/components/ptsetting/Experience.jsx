import React, { useState, useEffect } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const Experience = ({ formData, setFormData }) => {
  const [workExperience, setExperiences] = useState(formData.workExperience || []);

  const [newExperience, setNewExperience] = useState({
    institution: "",
    position: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });

  const [isOpen, setIsOpen] = useState(false); // collapsible

  useEffect(() => {
    setExperiences(formData.workExperience || []);
  }, [formData.workExperience]);

  const handleNewExperienceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewExperience((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "current" && checked ? { endDate: "" } : {}),
    }));
  };

  const validateDates = (start, end) => {
    if (!start) return false;
    if (!end) return true;
    return new Date(start) <= new Date(end);
  };

  const convertToFullDate = (monthString) => {
    if (!monthString) return null;
    const [year, month] = monthString.split("-").map(Number);
    return new Date(year, month - 1, 1);
  };

  const addExperience = () => {
    if (!newExperience.position || !newExperience.institution || !newExperience.startDate) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!validateDates(newExperience.startDate, newExperience.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    const expToAdd = {
      ...newExperience,
      startDate: convertToFullDate(newExperience.startDate),
      endDate: newExperience.current ? null : convertToFullDate(newExperience.endDate),
    };

    const updated = [...workExperience, expToAdd];
    setExperiences(updated);
    setFormData((prev) => ({ ...prev, workExperience: updated }));

    setNewExperience({
      institution: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });

    toast.success("Experience added");
  };

  const removeExperience = (index) => {
    const updated = workExperience.filter((_, i) => i !== index);
    setExperiences(updated);
    setFormData((prev) => ({ ...prev, workExperience: updated }));
    toast.success("Experience removed");
  };

  const formatDate = (date) => {
    if (!date) return "";
    return dayjs(date).format("MMM YYYY");
  };

  return (
    <div className="card bg-white shadow-md p-6">
      {/* Collapsible Experience */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">Experience</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        
        <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-md">
          {/* Experience List */}
          <div className="mb-6 space-y-4">
            {workExperience.map((exp, index) => (
              <div key={index} className="p-4 bg-alice rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-tufts">{exp.position}</h3>
                    <p className="text-sm font-medium text-gray-700">{exp.institution}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="position"
              value={newExperience.position}
              onChange={handleNewExperienceChange}
              placeholder="Position/Title *"
              className="input input-bordered text-sm"
            />

            <input
              type="text"
              name="institution"
              value={newExperience.institution}
              onChange={handleNewExperienceChange}
              placeholder="Company/Clinic Name *"
              className="input input-bordered text-sm"
            />

            <input
              type="month"
              name="startDate"
              value={newExperience.startDate}
              onChange={handleNewExperienceChange}
              className="input input-bordered text-sm"
            />

            <input
              type="month"
              name="endDate"
              value={newExperience.endDate}
              onChange={handleNewExperienceChange}
              className="input input-bordered text-sm"
              disabled={newExperience.current}
            />

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
              placeholder="Description"
              className="textarea textarea-bordered w-full text-sm md:col-span-2 h-24"
            />
          </div>

          <button
            type="button"
            onClick={addExperience}
            className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Experience
          </button>
        </div>
      )}
    </div>
  );
};

export default Experience;
