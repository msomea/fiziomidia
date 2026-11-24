import API from "./axios";

export const fetchTeamMembers = async () => {
  const { data } = await API.get("/team-members");
  return data;
};

export const adminFetchTeamMembers = async () => {
  const { data } = await API.get("/admin/team-members");
  return data;
};

export const adminCreateTeamMember = async (formData) => {
  const { data } = await API.post("/admin/team-members", formData);
  return data;
};

export const adminUpdateTeamMember = async (id, formData) => {
  const { data } = await API.put(`/admin/team-members/${id}`, formData);
  return data;
};

export const adminDeleteTeamMember = async (id) => {
  const { data } = await API.delete(`/admin/team-members/${id}`);
  return data;
};
