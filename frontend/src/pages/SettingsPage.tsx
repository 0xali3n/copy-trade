import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  FaCamera,
  FaTwitter,
  FaSignOutAlt,
  FaSave,
  FaCopy,
  FaCheck,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

interface UserSettings {
  bio: string | null;
  twitter_username: string | null;
  twitter_connected: boolean;
  theme: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
}

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    bio: null,
    twitter_username: null,
    twitter_connected: false,
    theme: "light",
    notifications_enabled: true,
    email_notifications: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fullName, setFullName] = useState<string>("");

  // Load user settings on component mount
  useEffect(() => {
    if (user) {
      loadUserSettings();
      checkCurrentAvatarUrl(); // Check what's currently in the database
      setSettings((prev) => ({
        ...prev,
        bio: user.bio || null,
        twitter_username: user.twitter_username || null,
        twitter_connected: user.twitter_connected || false,
        theme: user.theme || "light",
        notifications_enabled: user.notifications_enabled !== false,
        email_notifications: user.email_notifications !== false,
      }));
      // Set initial profile image and full name
      setProfileImage(user.avatar_url || null);
      setFullName(user.full_name || "");
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          full_name,
          bio,
          twitter_username,
          twitter_connected,
          theme,
          notifications_enabled,
          email_notifications,
          avatar_url
        `
        )
        .eq("id", user.id)
        .single();

      if (data && !error) {
        setSettings({
          bio: data.bio,
          twitter_username: data.twitter_username,
          twitter_connected: data.twitter_connected,
          theme: data.theme,
          notifications_enabled: data.notifications_enabled,
          email_notifications: data.email_notifications,
        });
        // Set full name and profile image
        setFullName(data.full_name || "");
        setProfileImage(data.avatar_url || user?.avatar_url || null);
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  };

  const saveImageToDatabase = async (imageUrl: string) => {
    if (!user) return;

    try {
      console.log("Attempting to save image URL to database:", imageUrl);
      console.log("User ID:", user.id);

      const { data, error } = await supabase
        .from("users")
        .update({
          avatar_url: imageUrl,
          settings_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select();

      if (error) {
        console.error("Error saving image URL to database:", error);
        console.error("Full error details:", JSON.stringify(error, null, 2));
      } else {
        console.log("Image URL saved to database successfully");
        console.log("Updated data:", data);
        // Verify the update worked
        setTimeout(() => checkCurrentAvatarUrl(), 1000);
      }
    } catch (error) {
      console.error("Error saving image URL:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updateData = {
        full_name: fullName,
        bio: settings.bio,
        twitter_username: settings.twitter_username,
        twitter_connected: settings.twitter_connected,
        theme: settings.theme,
        notifications_enabled: settings.notifications_enabled,
        email_notifications: settings.email_notifications,
        avatar_url: profileImage,
        settings_updated_at: new Date().toISOString(),
      };

      console.log("Saving settings to database:", updateData);

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id)
        .select();

      if (error) throw error;

      console.log("Settings saved successfully:", data);
      setIsEditing(false);
      setShowSuccessMessage(true);

      // Auto-refresh the page after 2 seconds to show all changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      // Try Supabase Storage first
      const storageResult = await uploadToSupabaseStorage(file);

      if (storageResult.success && storageResult.url) {
        // Update local state with storage URL
        setProfileImage(storageResult.url);
        setIsEditing(true);

        // Auto-save the image URL to database
        await saveImageToDatabase(storageResult.url);
      } else {
        // Fallback to base64 storage
        console.log("Storage upload failed, using base64 fallback...");
        const base64Result = await uploadAsBase64(file);

        if (base64Result.success && base64Result.url) {
          setProfileImage(base64Result.url);
          setIsEditing(true);

          // Auto-save the base64 image to database
          await saveImageToDatabase(base64Result.url);
        } else {
          alert("Failed to upload image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadToSupabaseStorage = async (file: File) => {
    try {
      // Create a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Try to upload to avatars bucket first, fallback to public bucket
      let bucketName = "avatars";
      let { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      // If avatars bucket doesn't exist, try public bucket
      if (error && error.message?.includes("Bucket not found")) {
        console.log("Avatars bucket not found, trying public bucket...");
        bucketName = "public";
        const retryResult = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });
        error = retryResult.error;
      }

      if (error) {
        console.error("Storage upload error:", error);
        return { success: false, error };
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error("Storage upload error:", error);
      return { success: false, error };
    }
  };

  const uploadAsBase64 = async (
    file: File
  ): Promise<{ success: boolean; url?: string; error?: any }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve({ success: true, url: result });
      };
      reader.onerror = (error) => {
        console.error("Base64 conversion error:", error);
        resolve({ success: false, error });
      };
      reader.readAsDataURL(file);
    });
  };

  const checkCurrentAvatarUrl = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("avatar_url, full_name, email, created_at, last_login")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching current user data:", error);
      } else {
        console.log("🔍 Current user data in database:", {
          id: user.id,
          email: data?.email,
          full_name: data?.full_name,
          avatar_url: data?.avatar_url,
          created_at: data?.created_at,
          last_login: data?.last_login,
        });
        console.log("🔍 Current user data in context:", {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        });
      }
    } catch (error) {
      console.error("Error checking user data:", error);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">
          Customize your profile and manage your account preferences
        </p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <FaCheck className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">
            Settings saved successfully!
          </span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Profile Photo */}
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                  onError={(e) => {
                    // Fallback to Google avatar if uploaded image fails to load
                    const target = e.target as HTMLImageElement;
                    if (target.src !== user?.avatar_url) {
                      target.src = user?.avatar_url || "";
                    }
                  }}
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center group-hover:from-blue-700 group-hover:to-indigo-700 transition-colors">
                  <span className="text-white font-bold text-2xl">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <label
                className={`absolute -bottom-1 -right-1 p-2 rounded-full cursor-pointer transition-colors shadow-lg ${
                  uploadingImage
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FaCamera className="w-4 h-4 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 font-medium text-lg">
                Profile Photo
              </h3>
              <p className="text-gray-500 text-sm">
                Click the camera icon to upload a new photo. Supported formats:
                JPG, PNG, GIF
              </p>
              <p className="text-blue-600 text-xs mt-1">
                💡 Tip: Use a clear, professional photo for better recognition
              </p>
              <div className="flex space-x-2 mt-1">
                <button
                  onClick={checkCurrentAvatarUrl}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  🔍 Check database
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  🔄 Refresh page
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setIsEditing(true);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
          <p className="text-gray-500 text-xs mt-1">
            💡 This is how your name will appear to other traders
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={settings.bio || ""}
            onChange={(e) => {
              setSettings((prev) => ({
                ...prev,
                bio: e.target.value,
              }));
              setIsEditing(true);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell other traders about your trading experience, strategies, or interests..."
            rows={3}
          />
          <p className="text-gray-500 text-xs mt-1">
            💡 Optional: Share your trading background to build trust with other
            traders
          </p>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
            {user?.email}
          </div>
          <p className="text-gray-500 text-xs mt-1">
            💡 Email is managed through your Google account and cannot be
            changed here
          </p>
        </div>

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Address
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm truncate">
              {user?.aptos_wallet_address || "No wallet connected"}
            </div>
            {user?.aptos_wallet_address && (
              <button
                onClick={() => handleCopy(user.aptos_wallet_address!, "wallet")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy wallet address"
              >
                {copied === "wallet" ? (
                  <FaCheck className="w-4 h-4" />
                ) : (
                  <FaCopy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-1">
            💡 Your Aptos wallet address for receiving funds and trading
          </p>
        </div>

        {/* Private Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Private Key
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
              {showPrivateKey ? (
                <span className="text-gray-900 break-all">
                  {user?.aptos_private_key || "No private key available"}
                </span>
              ) : (
                <span className="text-gray-500">
                  ••••••••••••••••••••••••••••••••
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={showPrivateKey ? "Hide private key" : "Show private key"}
            >
              {showPrivateKey ? (
                <FaEyeSlash className="w-4 h-4" />
              ) : (
                <FaEye className="w-4 h-4" />
              )}
            </button>
            {showPrivateKey && user?.aptos_private_key && (
              <button
                onClick={() => handleCopy(user.aptos_private_key!, "private")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy private key"
              >
                {copied === "private" ? (
                  <FaCheck className="w-4 h-4" />
                ) : (
                  <FaCopy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-red-600 mt-1">
            ⚠️ Never share your private key with anyone - it provides full
            access to your wallet
          </p>
        </div>

        {/* Twitter Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Twitter Username
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={settings.twitter_username || ""}
              onChange={(e) => {
                setSettings((prev) => ({
                  ...prev,
                  twitter_username: e.target.value,
                }));
                setIsEditing(true);
              }}
              placeholder="@username"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FaTwitter className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-gray-500 text-xs mt-1">
            💡 Optional: Connect your Twitter to share trades and build your
            trading community
          </p>
          {settings.twitter_connected && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Twitter account connected
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving || !isEditing}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
              isEditing
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FaSave className="w-4 h-4" />
            <span>
              {saving
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "No changes to save"}
            </span>
          </button>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <FaSignOutAlt className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
