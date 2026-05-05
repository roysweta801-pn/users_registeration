import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { authService } from "../services/authService";
import toast from "react-hot-toast";

function PasswordResetConfirm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm();

  const password = watch("new_password");

  const onSubmit = async (data) => {
    if (!token) {
      setError("root", {
        type: "manual",
        message: "Invalid reset link. Please request a new password reset.",
      });
      return;
    }

    setLoading(true);
    try {
      await authService.confirmPasswordReset(
        token,
        data.new_password,
        data.new_password_confirm
      );
      setSuccess(true);
      toast.success("Password reset successfully");
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setError("root", {
          type: "manual",
          message: error.response.data.error,
        });
      } else {
        toast.error("Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The password reset link is invalid or has expired. Please request
              a new password reset.
            </p>
          </div>

          <div className="text-center">
            <Link to="/password-reset" className="btn-primary">
              Request New Reset
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Password Reset Successfully
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been updated. You can now sign in with your new
              password.
            </p>
          </div>

          <div className="text-center">
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="new_password" className="form-label">
                New Password
              </label>
              <input
                id="new_password"
                type="password"
                autoComplete="new-password"
                className={`input-field ${
                  errors.new_password ? "border-red-500" : ""
                }`}
                {...register("new_password", {
                  required: "New password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
              />
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.new_password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new_password_confirm" className="form-label">
                Confirm New Password
              </label>
              <input
                id="new_password_confirm"
                type="password"
                autoComplete="new-password"
                className={`input-field ${
                  errors.new_password_confirm ? "border-red-500" : ""
                }`}
                {...register("new_password_confirm", {
                  required: "Please confirm your new password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
              />
              {errors.new_password_confirm && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.new_password_confirm.message}
                </p>
              )}
            </div>
          </div>

          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PasswordResetConfirm;
