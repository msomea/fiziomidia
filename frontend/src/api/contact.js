import API from "./axios";
import { API_URL } from "../config/constants";

// ---------------------------
// Send contact form message
// ---------------------------
export const sendContactMessage = async (formData) => {
  const res = await API.post(`${API_URL}/contact`, formData);
  return res.data;
};
