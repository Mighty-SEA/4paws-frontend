/**
 * Update Button Component for 4Paws Frontend
 *
 * Usage in Layout/Topbar:
 * import UpdateButton from '@/components/update/UpdateButton';
 * <UpdateButton />
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { io, Socket } from "socket.io-client";

import UpdateModal from "./update-modal";

interface UpdateInfo {
  current: {
    frontend: string;
    backend: string;
  };
  latest: {
    frontend?: string;
    backend?: string;
  };
  has_update: boolean;
  details: {
    frontend: {
      current: string;
      latest: string | null;
      has_update: boolean;
    };
    backend: {
      current: string;
      latest: string | null;
      has_update: boolean;
    };
  };
}

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:5000";

export default function UpdateButton() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const checkForUpdates = useCallback(async () => {
    // Use functional update to avoid dependency on checkingUpdate
    setCheckingUpdate((checking) => {
      if (checking) return true; // Already checking, skip
      return true; // Start checking
    });

    try {
      const res = await fetch(`${AGENT_URL}/api/update/check`);
      const data: UpdateInfo = await res.json();

      console.log("Update check response:", data);
      console.log("has_update:", data.has_update);
      console.log("details:", data.details);

      if (data.has_update) {
        setUpdateAvailable(true);
        setUpdateInfo(data);
        console.log("✅ Update available! Setting state...");
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(data);
        console.log("❌ No updates available");
      }
    } catch (error) {
      // Silently fail - agent might not be running
      console.debug(
        "Agent update check unavailable (agent may not be running):",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setCheckingUpdate(false);
    }
  }, []); // ✅ No dependencies - stable function

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!socketRef.current) {
      const socket = io(AGENT_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 3, // Only try 3 times
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("✅ Connected to update WebSocket");
      });

      socket.on("update_checking", (data: { checking: boolean; message: string }) => {
        console.log("⏳ Update check in progress:", data.message);
        setCheckingUpdate(data.checking);
      });

      socket.on("update_available", (data: UpdateInfo) => {
        console.log("📦 Update check result:", data);
        setCheckingUpdate(false);

        if (data.has_update) {
          setUpdateAvailable(true);
          setUpdateInfo(data);
          console.log("✅ Update available! Setting state...");
        } else {
          setUpdateAvailable(false);
          setUpdateInfo(data);
          console.log("❌ No updates available");
        }

        // Show dropdown with result
        setShowDropdown(true);
      });

      socket.on("update_check_error", (data: { error: string; message: string }) => {
        console.error("❌ Update check failed:", data.error);
        setCheckingUpdate(false);
        alert(`Update check failed: ${data.message}`);
      });

      socket.on("disconnect", () => {
        // Only log if it was previously connected
        if (socket.connected === false && socket.disconnected === true) {
          console.debug("Disconnected from update WebSocket");
        }
      });

      socket.on("connect_error", (error: Error) => {
        // Silently fail - agent might not be running
        console.debug("Agent connection error (this is normal if agent is not running):", error.message);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Check for updates on mount (initial check)
  useEffect(() => {
    void checkForUpdates();
  }, [checkForUpdates]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDropdown]);

  const handleUpdate = async () => {
    setUpdating(true);

    try {
      // Start update
      const res = await fetch(`${AGENT_URL}/api/update/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ component: "all" }),
      });

      const result = await res.json();

      if (result.success) {
        console.log("Update started successfully");

        // Immediately reload page to show Python loading server
        // The frontend server will be stopped and replaced with loading page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert("Failed to start update: " + (result.error ?? "Unknown error"));
        setUpdating(false);
      }
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to start update. Please try again.");
      setUpdating(false);
    }
  };

  const handleUpdateComplete = () => {
    setUpdating(false);
    setUpdateAvailable(false);
    setShowModal(false);

    // Reload page after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleButtonClick = async () => {
    if (checkingUpdate) return;

    // If dropdown already open with info, just toggle
    if (showDropdown && updateInfo) {
      setShowDropdown(false);
      return;
    }

    // Trigger manual check (will broadcast to all clients)
    setCheckingUpdate(true);
    try {
      const res = await fetch(`${AGENT_URL}/api/update/trigger-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json();

      if (!result.success) {
        // Handle debounce error
        if (result.wait_seconds) {
          alert(`Please wait ${result.wait_seconds} seconds before checking again`);
        } else if (result.checking) {
          console.log("Update check already in progress");
        } else {
          alert(result.error ?? "Failed to check for updates");
        }
        setCheckingUpdate(false);
      }
      // If success, result will come via WebSocket (update_available event)
    } catch (error) {
      console.error("Failed to trigger update check:", error);
      setCheckingUpdate(false);
      alert("Failed to check for updates. Please try again.");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Update Button */}
      <button
        onClick={handleButtonClick}
        className={`relative rounded-lg p-2 transition-all ${
          updateAvailable
            ? "animate-pulse text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        }`}
        title={updateAvailable ? "Update Available!" : "Check for Updates"}
        disabled={checkingUpdate}
      >
        <span className="text-xl">{checkingUpdate ? "⏳" : "🔄"}</span>

        {/* Red Dot Indicator */}
        {updateAvailable && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && updateInfo && (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {updateAvailable ? (
            // Has Updates
            <div className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Update Available!</h3>
              </div>

              <div className="mb-4 space-y-2">
                {updateInfo.details.frontend.has_update && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">🎨 Frontend:</span>
                    <span className="font-mono text-xs">
                      <span className="text-gray-500">{updateInfo.details.frontend.current}</span>
                      {" → "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {updateInfo.details.frontend.latest}
                      </span>
                    </span>
                  </div>
                )}

                {updateInfo.details.backend.has_update && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">🔧 Backend:</span>
                    <span className="font-mono text-xs">
                      <span className="text-gray-500">{updateInfo.details.backend.current}</span>
                      {" → "}
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {updateInfo.details.backend.latest}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowModal(true);
                }}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-2 text-sm font-semibold text-white transition-all hover:from-blue-700 hover:to-purple-700"
              >
                View Details & Update
              </button>
            </div>
          ) : (
            // No Updates
            <div className="p-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <span className="text-xl">✓</span>
                <span className="font-medium">Already up to date</span>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Frontend: v{updateInfo.current.frontend}
                <br />
                Backend: v{updateInfo.current.backend}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Update Modal */}
      {showModal && updateInfo && (
        <UpdateModal
          updateInfo={updateInfo}
          updating={updating}
          onUpdate={handleUpdate}
          onClose={() => setShowModal(false)}
          onComplete={handleUpdateComplete}
        />
      )}
    </div>
  );
}
