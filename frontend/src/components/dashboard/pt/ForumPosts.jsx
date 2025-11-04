import React from "react";
import dayjs from "dayjs"

const ForumPosts = ({ posts }) => (
  <div className="bg-white p-4 rounded-xl shadow mt-6">
    <h2 className="text-lg font-semibold mb-3">Recent Forum Activity</h2>
    {posts.length > 0 ? (
      posts.map((post) => (
        <div key={post._id} className="border-b pb-2 mb-2">
          <h3 className="font-medium">{post.title}</h3>
          <p className="text-sm text-gray-500">
            { dayjs(post.createdAt).format("ddd, DD/MM/YYYY")}
          </p>
        </div>
      ))
    ) : (
      <p className="text-gray-500 text-sm">No recent forum posts</p>
    )}
    <a href="/forum/my-posts" className="text-blue-500 text-sm mt-3 block">
      View all forum posts →
    </a>
  </div>
);

export default ForumPosts;
