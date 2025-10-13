import React, { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const CreatePost = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sub: "",
    title: "",
  });

  const [subs] = useState([
    { _id: "1", name: "Rehab" },
    { _id: "2", name: "Exercise" },
    { _id: "3", name: "Nutrition" },
  ]);

  // Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your post here..." }),
    ],
    content: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const body = editor.getHTML();

    if (!formData.sub || !formData.title || !body) {
      toast.error("Please fill in all fields!");
      return;
    }

    // TODO: send to backend
    console.log({ ...formData, body });

    toast.success("Post created successfully!");
    navigate("/forum");
  };

  return (
    <div className="min-h-screen bg-alice mt-20 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-caribbean mb-6">
          Create New Post
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sub-Forum */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Sub-Forum
            </label>
            <select
              name="sub"
              value={formData.sub}
              onChange={handleChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select a sub-forum</option>
              {subs.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Enter post title"
              required
            />
          </div>

          {/* Tiptap Editor */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Body
            </label>
            <div className="border rounded-lg p-2 bg-white">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn bg-caribbean text-white hover:bg-tufts"
            >
              Create Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
