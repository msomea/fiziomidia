export default function Statistics({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((item) => (
        <div
          key={item.title}
          className="bg-white rounded-xl shadow p-4 text-center border border-alice"
        >
          <h3 className="text-sm text-gray-500">{item.title}</h3>
          <p className="text-2xl font-bold text-caribbean mt-1">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
