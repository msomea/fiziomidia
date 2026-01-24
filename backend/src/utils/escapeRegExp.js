export default function escapeRegExp(string = "") {
  // From MDN: escape special regex characters
  return String(string).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");
}
