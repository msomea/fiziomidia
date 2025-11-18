export default function TextAreaField({ label, name, value, onChange, rows = 3 }) {
  return (
    <div className="form-control">
      <label className="font-semibold text-black">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="textarea text-white bg-caribbean  textarea-bordered w-full mt-1"
      />
    </div>
  );
}
