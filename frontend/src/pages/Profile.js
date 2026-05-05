import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import BackButton from "../components/BackButton";

function Profile() {
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const { user, updateProfile, disable2FA, changePassword } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  const onSubmitProfile = async (data) => {
    setLoading(true);
    try {
      await updateProfile(data);
    } catch (error) {
      if (error.response?.data?.error) {
        setError("root", {
          type: "manual",
          message: error.response.data.error,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data) => {
    setLoading(true);
    try {
      await changePassword(
        data.current_password,
        data.new_password,
        data.new_password_confirm
      );
      setShowChangePassword(false);
    } catch (error) {
      if (error.response?.data?.error) {
        setError("root", {
          type: "manual",
          message: error.response.data.error,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitDisable2FA = async (data) => {
    setLoading(true);
    try {
      await disable2FA(data.password);
      setShowDisable2FA(false);
    } catch (error) {
      if (error.response?.data?.error) {
        setError("root", {
          type: "manual",
          message: error.response.data.error,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <BackButton to="/" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Profile Information
            </h2>

            <form
              onSubmit={handleSubmit(onSubmitProfile)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="form-label">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    className={`input-field ${
                      errors.first_name ? "border-red-500" : ""
                    }`}
                    {...register("first_name", {
                      required: "First name is required",
                    })}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="form-label">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    className={`input-field ${
                      errors.last_name ? "border-red-500" : ""
                    }`}
                    {...register("last_name", {
                      required: "Last name is required",
                    })}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className={`input-field ${
                    errors.username ? "border-red-500" : ""
                  }`}
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                  })}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={`input-field ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{errors.root.message}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-6">
          {/* 2FA Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Two-Factor Authentication
            </h3>

            <div className="flex items-center mb-4">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  user?.is_2fa_enabled ? "bg-green-100" : "bg-yellow-100"
                }`}
              >
                {user?.is_2fa_enabled ? (
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.is_2fa_enabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-sm text-gray-600">
                  {user?.is_2fa_enabled
                    ? "Your account is protected with 2FA"
                    : "Enable 2FA for enhanced security"}
                </p>
              </div>
            </div>

            {user?.is_2fa_enabled ? (
              <button
                onClick={() => setShowDisable2FA(true)}
                className="btn-danger w-full"
              >
                Disable 2FA
              </button>
            ) : (
              <a href="/2fa/setup" className="btn-primary w-full text-center">
                Enable 2FA
              </a>
            )}
          </div>

          {/* Account Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Member Since
                </dt>
                <dd className="text-sm text-gray-900">
                  {new Date(user?.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Disable 2FA Modal */}
      {showDisable2FA && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Disable Two-Factor Authentication
              </h3>
              <p className="text-gray-600 mb-4">
                Enter your password to disable 2FA. This will make your account
                less secure.
              </p>

              <form
                onSubmit={handleSubmit(onSubmitDisable2FA)}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="disable_password" className="form-label">
                    Password
                  </label>
                  <input
                    id="disable_password"
                    type="password"
                    className={`input-field ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    {...register("password", {
                      required: "Password is required",
                    })}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-danger flex-1"
                  >
                    {loading ? "Disabling..." : "Disable 2FA"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisable2FA(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
