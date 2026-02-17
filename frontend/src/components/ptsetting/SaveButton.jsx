import React from "react";
import { useTranslation } from "react-i18next";

const SaveButton = ({ loading }) => {
  const { t } = useTranslation();

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
        t("saving")
      )}
    </button>
  </div>
};

export default SaveButton;
