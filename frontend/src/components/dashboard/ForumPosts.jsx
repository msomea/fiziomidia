export default function ForumPosts({ posts }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="font-semibold text-lg mb-3">Recent Forum Posts</h2>
      <ul className="space-y-2">
        {posts.map((post, i) => (
          <li key={i} className="border-b pb-2">
            <p className="font-medium">{post.title}</p>
            <p className="text-sm text-gray-500">{post.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
