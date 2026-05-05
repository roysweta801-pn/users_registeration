import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import BackButton from "../components/BackButton";

function TwoFactorSetup() {
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const { setup2FA, verify2FASetup } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  useEffect(() => {
    loadSetupData();
  }, []);

  const loadSetupData = async () => {
    try {
      const data = await setup2FA();
      setSetupData(data);
    } catch (error) {
      console.error("Failed to load 2FA setup data:", error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await verify2FASetup(data.token);
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

  if (!setupData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton to="/" />
      </div>

      <div className="card">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Set Up Two-Factor Authentication
          </h1>
          <p className="text-gray-600">
            Scan the QR code with your authenticator app to enable 2FA
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code</h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
              <img
                src={setupData.qr_code}
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Scan this QR code with your authenticator app
            </p>
          </div>

          {/* Manual Setup Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Manual Setup
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                If you can't scan the QR code, enter this code manually:
              </p>
              <div className="bg-white p-3 rounded border border-gray-200">
                <code className="text-sm font-mono text-gray-900 break-all">
                  {setupData.secret}
                </code>
              </div>
            </div>
          </div>
        </div>

       

        {/* Verification Form */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Verify Setup
          </h3>
          <p className="text-gray-600 mb-4">
            Enter the 6-digit code from your authenticator app to complete the
            setup.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="token" className="form-label">
                6-Digit Code
              </label>
              <input
                id="token"
                type="text"
                maxLength="6"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                "Enable Two-Factor Authentication"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TwoFactorSetup;
