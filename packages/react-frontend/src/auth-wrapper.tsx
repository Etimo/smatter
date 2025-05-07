import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Endpoints, useSmatterQuery } from "./api/api";
import { useUserStore } from "./stores/user-store";

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const userStore = useUserStore();

  const { isError, data, isLoading } = useSmatterQuery(Endpoints.auth.me(), {
    refetchInterval: 30000, // refetch every 30 seconds
    retry: false,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (isError) navigate("/login");
    // update user data if changed
    else if (data && JSON.stringify(userStore.user) !== JSON.stringify(data))
      userStore.setUser(data);
  }, [data, isError, navigate, userStore]);

  if (isLoading && !userStore.user) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default AuthWrapper;
