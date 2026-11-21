import { useTranslation } from "react-i18next";
import ResourceUploadForm from "../../components/education/ResourceUploadForm";

export default function UploadResource() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-alice mt-20 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-caribbean mb-2">{t("edu_upload_title")}</h1>
        <p className="text-tufts mb-6">{t("edu_upload_desc")}</p>
        <ResourceUploadForm />
      </div>
    </div>
  );
}
