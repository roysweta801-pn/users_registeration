import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import BackButton from "../components/BackButton";

function TwoFactorVerify({ onVerify, isSetup = false }) {
  const [loading, setLoading] = useState(false);
  const [isBackupCode, setIsBackupCode] = useState(false);
  const { verify2FA, pending2FAEmail } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (onVerify) {
        await onVerify(data.token, isBackupCode);
      } else {
        await verify2FA(data.token, isBackupCode);
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setError("token", {
          type: "manual",
          message: error.response.data.error,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSetup
              ? "Enter the 6-digit code from your authenticator app"
              : `Enter the 6-digit code for ${pending2FAEmail}`}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="token" className="form-label">
                6-Digit Code
              </label>
              <input
                id="token"
                type="text"
                maxLength="6"
                autoComplete="one-time-code"
                className={`input-field text-center text-lg tracking-widest ${
                  errors.token ? "border-red-500" : ""
                }`}
                placeholder="000000"
                {...register("token", {
                  required: "Please enter the 6-digit code",
                  pattern: {
                    value: /^\d{6}$/,
                    message: "Please enter a 6-digit code",
                  },
                })}
              />
              {errors.token && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.token.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="backup-code"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={isBackupCode}
                  onChange={(e) => setIsBackupCode(e.target.checked)}
                />
                <label
                  htmlFor="backup-code"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Use backup code
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Verify"
              )}
            </button>
          </div>

          {!isSetup && (
            <div className="text-center">
              <BackButton to="/login" className="text-sm">
                Back to Login
              </BackButton>
            </div>
          )}
        </form>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Need help?</h4>
              <p className="text-sm text-blue-700 mt-1">
                If you're having trouble with your authenticator app, you can
                use a backup code instead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TwoFactorVerify;
