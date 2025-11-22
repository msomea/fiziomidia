import React, { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";

const Documents = ({ formData, setFormData }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), ...files]
    }));
  };

  const removeDocument = (index) => {
    const updated = formData.documents.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, documents: updated }));
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">Documents</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <input
            type="file"
            multiple
            onChange={handleDocumentUpload}
            className="file-input file-input-bordered w-full"
          />

          {formData.documents?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.documents.map((file, i) => (
                <span key={file.name || file.url} className="badge badge-outline flex items-center gap-1">
                  {file.name || file.url}
                  <button onClick={() => removeDocument(i)} className="text-red-500 hover:text-red-700">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Documents;
