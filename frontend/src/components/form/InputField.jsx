export default function InputField({ label, name, type = "text", value, onChange }) {
  return (
    <div className="form-control">
      <label className="font-semibold text-black">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="input text-white bg-caribbean input-bordered w-full mt-1"
      />
    </div>
  );
}
