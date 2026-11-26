import React, { createContext, useContext } from "react";
import { useForumData } from "../hooks/useForum";

const ForumContext = createContext();

export const ForumProvider = ({ children }) => {
  const forumData = useForumData();

  return (
    <ForumContext.Provider value={forumData}>
      {children}
    </ForumContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useForum = () => useContext(ForumContext);
