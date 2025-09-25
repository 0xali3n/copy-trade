import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const UserProfile: React.FC = () => {
  const { user, updateProfile, updateSettings } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    display_name: user?.profile_data?.display_name || "",
    avatar_url: user?.profile_data?.avatar_url || "",
  });
  const [tradingSettings, setTradingSettings] = useState({
    copy_size_multiplier: user?.trading_settings?.copy_size_multiplier || 1.0,
    max_copy_size: user?.trading_settings?.max_copy_size || 1000,
    min_copy_size: user?.trading_settings?.min_copy_size || 0.001,
    target_wallet_address: user?.trading_settings?.target_wallet_address || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSave = async () => {
    try {
      setIsSaving(true);
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings(tradingSettings);
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">User Profile</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* Profile Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Profile Information
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address
            </label>
            <p className="text-white font-mono text-sm bg-white/5 p-3 rounded-lg">
              {user.wallet_address}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.display_name}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    display_name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter display name"
              />
            ) : (
              <p className="text-white">
                {user.profile_data?.display_name || "Not set"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Member Since
            </label>
            <p className="text-white">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Login
            </label>
            <p className="text-white">
              {new Date(user.last_login).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Trading Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Trading Settings</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Copy Size Multiplier
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={tradingSettings.copy_size_multiplier}
              onChange={(e) =>
                setTradingSettings({
                  ...tradingSettings,
                  copy_size_multiplier: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Copy Size
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={tradingSettings.max_copy_size}
              onChange={(e) =>
                setTradingSettings({
                  ...tradingSettings,
                  max_copy_size: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Min Copy Size
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={tradingSettings.min_copy_size}
              onChange={(e) =>
                setTradingSettings({
                  ...tradingSettings,
                  min_copy_size: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Wallet Address
            </label>
            <input
              type="text"
              value={tradingSettings.target_wallet_address}
              onChange={(e) =>
                setTradingSettings({
                  ...tradingSettings,
                  target_wallet_address: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter target wallet address for copy trading"
            />
          </div>
        </div>
      </div>

      {/* Save Buttons */}
      {isEditing && (
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleSettingsSave}
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
          <button
            onClick={handleProfileSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
