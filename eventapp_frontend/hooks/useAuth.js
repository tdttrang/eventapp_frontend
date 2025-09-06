// hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

// Hook để dùng AuthContext
export const useAuth = () => useContext(AuthContext);
