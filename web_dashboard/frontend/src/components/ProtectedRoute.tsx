import {JSX, useEffect, useState} from "react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({
  children,
  allowedRoles = [],
}: {
  children: JSX.Element,
  allowedRoles: string[],
}) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setRole(data.role || "user");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-cyan-200 p-12">Checking access...</div>;

  if (!allowedRoles.includes(role || "user")) {
    return <Navigate to="/" replace />;
    // Or: return <div className="text-red-400 p-12">You do not have access.</div>
  }

  return children;
}
