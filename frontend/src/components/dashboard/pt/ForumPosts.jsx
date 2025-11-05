import React from "react";
import dayjs from "dayjs"
import { Link } from "react-router";

const ForumPosts = ({ posts, id }) => (
  
  <div className="bg-white p-4 rounded-xl shadow mt-6">
    <h2 className="text-lg font-semibold mb-3">Recent Forum Activity</h2>
    {posts.length > 0 ? (
      posts.map((post) => (
        <div key={post._id} className="border-b pb-2 mb-2">
          <Link to={`/forum/post/${post._id}`} className="text-caribbean font-medium">{post.title}</Link>
          <p className="text-sm text-gray-500">
            { dayjs(post.createdAt).format("ddd, DD/MM/YYYY")}
          </p>
        </div>
      ))
    ) : (
      <p className="text-gray-500 text-sm">No recent forum posts</p>
    )}
    <Link to={`/forum/pt/posts/${id}`} className="text-blue-500 text-sm mt-3 block">
      View all forum posts →
    </Link>
  </div>
);

export default ForumPosts;
