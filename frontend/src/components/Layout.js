import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {" "}
      {/* Header */}{" "}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {" "}
            {/* Logo */}{" "}
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600">
                Auth App{" "}
              </Link>{" "}
            </div>
            {/* Navigation */}{" "}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/")
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                }`}
              >
                Dashboard{" "}
              </Link>{" "}
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/profile")
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                }`}
              >
                Profile{" "}
              </Link>{" "}
              <Link
                to="/2fa/setup"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/2fa/setup")
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                }`}
              >
                2 FA Setup{" "}
              </Link>{" "}
            </nav>
            {/* User menu */}{" "}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="text-sm text-gray-700">
                  Welcome, {user && (user.first_name || user.username)}{" "}
                </div>{" "}
              </div>{" "}
              <button onClick={handleLogout} className="btn-secondary text-sm">
                Logout{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </header>
      {/* Main content */}{" "}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0"> {children} </div>{" "}
      </main>{" "}
    </div>
  );
}

export default Layout;
