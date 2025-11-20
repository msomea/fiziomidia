import React from "react";

const SaveButton = ({ loading }) => (
  <div className="card bg-white shadow-md p-6">
    <button
      type="submit"
      disabled={loading}
      className={`btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2 ${
        loading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <>
          <span className="inline-block animate-spin">⌛</span>
          Saving...
        </>
      ) : (
        'Save Changes'
      )}
    </button>
  </div>
);

export default SaveButton;
