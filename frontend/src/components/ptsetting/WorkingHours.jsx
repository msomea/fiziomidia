import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkingHours = ({ formData, setFormData }) => {
  const [workingDay, setWorkingDay] = useState('Monday');
  const [workingFrom, setWorkingFrom] = useState('09:00');
  const [workingTo, setWorkingTo] = useState('17:00');

  const weekDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  const addWorkingHours = () => {
    // Check if this day already has hours set
    const existingDay = formData.workingHours?.find(
      (wh) => wh.day === workingDay
    );

    if (existingDay) {
      toast.error('Working hours for this day already exist');
      return;
    }

    // Validate time
    if (workingFrom >= workingTo) {
      toast.error('End time must be after start time');
      return;
    }

    const newWorkingHours = [
      ...(formData.workingHours || []),
      {
        day: workingDay,
        from: workingFrom,
        to: workingTo
      }
    ];

    // Sort by day of week
    newWorkingHours.sort((a, b) => {
      return weekDays.indexOf(a.day) - weekDays.indexOf(b.day);
    });

    setFormData(prev => ({ ...prev, workingHours: newWorkingHours }));
    toast.success('Working hours added');
  };

  const removeWorkingHours = (day) => {
    const newWorkingHours = formData.workingHours?.filter(
      (wh) => wh.day !== day
    ) || [];
    setFormData(prev => ({ ...prev, workingHours: newWorkingHours }));
    toast.success('Working hours removed');
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-caribbean">Working Hours</h2>

      {/* Working Hours List */}
      <div className="mb-6 space-y-4">
        {formData.workingHours?.map((wh) => (
          <div key={wh.day} className="flex items-start justify-between p-4 bg-alice rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-tufts">{wh.day}</h3>
                <button
                  onClick={() => removeWorkingHours(wh.day)}
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

      {/* Add Working Hours Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={workingDay}
          onChange={(e) => setWorkingDay(e.target.value)}
          className="select select-bordered w-full text-sm"
        >
          {weekDays.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
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
        onClick={addWorkingHours}
        className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2 mt-4"
      >
        <Plus size={18} />
        Add Working Hours
      </button>
    </div>
  );
};

export default WorkingHours;