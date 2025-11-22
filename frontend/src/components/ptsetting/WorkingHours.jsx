import React, { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkingHours = ({ formData, setFormData }) => {
  const [workingDay, setWorkingDay] = useState('Monday');
  const [workingFrom, setWorkingFrom] = useState('09:00');
  const [workingTo, setWorkingTo] = useState('17:00');
  const [isOpen, setIsOpen] = useState(false);

  const weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const validateTime = (time) => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const addWorkingHours = () => {
    const existingDay = formData.workingHours?.find(
      (wh) => wh.dayOfWeek === workingDay
    );

    if (existingDay) {
      toast.error('Working hours for this day already exist');
      return;
    }

    if (!validateTime(workingFrom) || !validateTime(workingTo)) {
      toast.error("Invalid time format (HH:MM)");
      return;
    }

    if (workingFrom >= workingTo) {
      toast.error('End time must be after start time');
      return;
    }

    const newWorkingHours = [
      ...(formData.workingHours || []),
      {
        dayOfWeek: workingDay,
        from: workingFrom,
        to: workingTo,
        isAvailable: true,
      }
    ];

    // sort by weekday
    newWorkingHours.sort(
      (a, b) => weekDays.indexOf(a.dayOfWeek) - weekDays.indexOf(b.dayOfWeek)
    );

    setFormData(prev => ({ ...prev, workingHours: newWorkingHours }));
    toast.success('Working hours added');
  };

  const removeWorkingHours = (day) => {
    const newWorkingHours = formData.workingHours?.filter(
      (wh) => wh.dayOfWeek !== day
    ) || [];

    setFormData(prev => ({ ...prev, workingHours: newWorkingHours }));
    toast.success('Working hours removed');
  };

  return (
    <div className="card bg-white shadow-md p-6">

      {/* HEADER */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">Working Hours</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* COLLAPSIBLE BODY */}
      {isOpen && (
        <div className="mt-4">

          {/* Working Hours List */}
          <div className="mb-6 space-y-4">
            {formData.workingHours?.map((wh) => (
              <div
                key={`${wh.dayOfWeek}-${wh.from}-${wh.to}`}
                className="flex items-start justify-between p-4 bg-alice rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-tufts">{wh.dayOfWeek}</h3>
                    <button
                      type="button"
                      onClick={() => removeWorkingHours(wh.dayOfWeek)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {wh.from} - {wh.to}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Working Hours */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={workingDay}
              onChange={(e) => setWorkingDay(e.target.value)}
              className="select select-bordered w-full text-sm"
            >
              {weekDays.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>

            <input
              type="time"
              value={workingFrom}
              onChange={(e) => setWorkingFrom(e.target.value)}
              className="input input-bordered w-full text-sm"
            />

            <input
              type="time"
              value={workingTo}
              onChange={(e) => setWorkingTo(e.target.value)}
              className="input input-bordered w-full text-sm"
            />
          </div>

          <button
            type="button"
            onClick={addWorkingHours}
            className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2 mt-4"
          >
            <Plus size={18} />
            Add Working Hours
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkingHours;
