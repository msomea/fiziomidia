import React, { createContext, useContext } from "react";
import { useForumData } from "../hooks/useForum";
import { toast } from "react-hot-toast";

const ForumContext = createContext();

export const ForumProvider = ({ children }) => {
  const forumData = useForumData();

  return (
    <ForumContext.Provider value={forumData}>
      {children}
    </ForumContext.Provider>
  );
};

export const useForum = () => useContext(ForumContext);
