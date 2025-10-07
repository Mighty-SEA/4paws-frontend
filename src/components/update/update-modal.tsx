/**
 * Update Modal Component
 * Place this in: src/components/UpdateModal.tsx
 */

"use client";

import { useEffect, useState } from "react";

import { io, Socket } from "socket.io-client";

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

interface UpdateStatus {
  status: string;
  message: string;
  progress: number;
}

interface Props {
  updateInfo: UpdateInfo;
  updating: boolean;
  onUpdate: () => void;
  onClose: () => void;
  onComplete: () => void;
}

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:5000";

export default function UpdateModal({ updateInfo, updating, onUpdate, onClose, onComplete }: Props) {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    status: "ready",
    message: "Ready to update",
    progress: 0,
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const FRONTEND_PORT = 3100;

  // Setup WebSocket connection when updating starts
  useEffect(() => {
    if (updating && !socket) {
      const newSocket = io(AGENT_URL);

      newSocket.on("update_status", (data: UpdateStatus) => {
        console.log("Update status:", data);
        setUpdateStatus(data);

        if (data.status === "completed") {
          // Wait a bit, then show reconnecting message
          setTimeout(() => {
            setUpdateStatus({
              status: "reconnecting",
              message: "Update completed! Reconnecting to application...",
              progress: 95,
            });

            // Try to reconnect every 2 seconds
            let attempts = 0;
            const maxAttempts = 30; // 60 seconds total

            const checkConnection = setInterval(async () => {
              attempts++;
              try {
                const response = await fetch("/api/health", { method: "HEAD" });
                if (response.ok) {
                  clearInterval(checkConnection);
                  setUpdateStatus({
                    status: "completed",
                    message: "Connected! Reloading application...",
                    progress: 100,
                  });
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              } catch {
                console.log(`Reconnection attempt ${attempts}/${maxAttempts}...`);
                if (attempts >= maxAttempts) {
                  clearInterval(checkConnection);
                  alert("Unable to reconnect. Please refresh the page manually.");
                }
              }
            }, 2000);
          }, 3000);
        } else if (data.status === "failed") {
          setTimeout(() => {
            alert("Update failed! Please check the agent logs.");
            window.location.reload();
          }, 3000);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [updating, socket]);

  /**
   * Enhanced Update Handler:
   * 1. Show loading on button
   * 2. Start update via API
   * 3. Wait for update page to be ready (polling)
   * 4. Redirect to root path (/) instead of current path
   */
  const handleUpdateNow = async () => {
    setIsStarting(true);

    try {
      // Determine which components need updating
      const hasFrontendUpdate = updateInfo.details.frontend.has_update;
      const hasBackendUpdate = updateInfo.details.backend.has_update;

      let component = "all";
      if (hasFrontendUpdate && !hasBackendUpdate) {
        component = "frontend";
        console.log("📦 Updating frontend only");
      } else if (!hasFrontendUpdate && hasBackendUpdate) {
        component = "backend";
        console.log("📦 Updating backend only");
      } else if (hasFrontendUpdate && hasBackendUpdate) {
        component = "all";
        console.log("📦 Updating both frontend and backend");
      }

      // Step 1: Start update
      console.log(`🚀 Starting update (component: ${component})...`);
      const res = await fetch(`${AGENT_URL}/api/update/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ component }),
      });

      const result = await res.json();

      if (!result.success) {
        alert("Failed to start update: " + (result.error ?? "Unknown error"));
        setIsStarting(false);
        return;
      }

      console.log("✅ Update started successfully");

      // Step 2: Wait for services to stop and update page to start
      console.log("⏳ Waiting for update loading page to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Step 3: Check if update page is ready (with retry)
      const maxRetries = 10;

      for (let i = 0; i < maxRetries; i++) {
        try {
          console.log(`🔍 Checking update page... (attempt ${i + 1}/${maxRetries})`);
          await fetch(`http://localhost:${FRONTEND_PORT}/`, {
            method: "HEAD",
            mode: "no-cors",
          });

          // Page ready!
          console.log("✅ Update loading page is ready!");
          break;
        } catch {
          // Not ready yet, wait and retry
          console.log("⏳ Page not ready, waiting 500ms...");
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Step 4: Redirect to root path
      console.log("🔄 Redirecting to root path...");
      window.location.href = `http://localhost:${FRONTEND_PORT}/`;
    } catch (error) {
      console.error("❌ Update failed:", error);
      alert("Failed to start update. Please try again.");
      setIsStarting(false);
    }
  };

  // Prevent closing modal during update
  const handleClose = () => {
    if (updating || isStarting) {
      if (confirm("Update is in progress. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        {!updating && !isStarting ? (
          // Initial Update Info
          <div className="p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <span>🎉</span>
                <span>Update Available!</span>
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="mb-6 text-gray-600 dark:text-gray-400">
              A new version is available. Update now to get the latest features and improvements!
            </p>

            {/* Update Details */}
            <div className="mb-6 space-y-3">
              {updateInfo.details.frontend.has_update && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">🎨 Frontend</p>
                    <span className="rounded bg-blue-500 px-2 py-1 text-xs text-white">NEW</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-mono">{updateInfo.details.frontend.current}</span>
                    {" → "}
                    <span className="font-mono font-bold">{updateInfo.details.frontend.latest}</span>
                  </p>
                </div>
              )}

              {updateInfo.details.backend.has_update && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold text-green-900 dark:text-green-100">🔧 Backend</p>
                    <span className="rounded bg-green-500 px-2 py-1 text-xs text-white">NEW</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <span className="font-mono">{updateInfo.details.backend.current}</span>
                    {" → "}
                    <span className="font-mono font-bold">{updateInfo.details.backend.latest}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleUpdateNow}
                disabled={isStarting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Starting Update...</span>
                  </>
                ) : (
                  "Update Now"
                )}
              </button>
              <button
                onClick={handleClose}
                disabled={isStarting}
                className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Later
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-center text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>What happens during update:</strong>
                <br />
                You&apos;ll see a beautiful loading screen showing real-time progress.
                <br />
                You will be <strong>redirected to home page</strong> when update starts.
                <br />
                <span className="font-semibold text-green-600 dark:text-green-400">✨ No manual action needed!</span>
              </p>
            </div>
          </div>
        ) : (
          // Starting/Updating Progress
          <div className="p-8">{isStarting ? <StartingProgress /> : <UpdateProgress status={updateStatus} />}</div>
        )}
      </div>
    </div>
  );
}

// Starting Progress Component (shown while waiting for update page)
function StartingProgress() {
  return (
    <div className="text-center">
      {/* Animated Icon */}
      <div className="mb-6 animate-pulse text-6xl">🚀</div>

      {/* Status Title */}
      <h3 className="mb-2 text-2xl font-bold text-blue-500">Starting Update...</h3>

      {/* Status Message */}
      <p className="mb-6 text-gray-600 dark:text-gray-400">Preparing update environment...</p>

      {/* Loading Dots */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "0ms" }}></div>
        <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "150ms" }}></div>
        <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "300ms" }}></div>
      </div>

      {/* Additional Info */}
      <p className="text-sm text-gray-500 dark:text-gray-400">Please wait a moment...</p>
    </div>
  );
}

// Update Progress Component
function UpdateProgress({ status }: { status: UpdateStatus }) {
  const statusConfig: Record<string, { icon: string; color: string }> = {
    stopping_services: { icon: "⏹️", color: "text-red-500" },
    downloading: { icon: "📥", color: "text-blue-500" },
    extracting: { icon: "📦", color: "text-purple-500" },
    setup: { icon: "⚙️", color: "text-orange-500" },
    migrating: { icon: "🗄️", color: "text-yellow-500" },
    restarting: { icon: "🔄", color: "text-green-500" },
    reconnecting: { icon: "🔌", color: "text-cyan-500" },
    completed: { icon: "✅", color: "text-green-500" },
    failed: { icon: "❌", color: "text-red-500" },
  };

  const current = statusConfig[status.status] ?? statusConfig.downloading;

  return (
    <div className="text-center">
      {/* Animated Icon */}
      <div className={`mb-6 text-6xl ${status.status === "completed" ? "animate-bounce" : "animate-pulse"}`}>
        {current.icon}
      </div>

      {/* Status Title */}
      <h3 className={`mb-2 text-2xl font-bold ${current.color}`}>
        {status.status === "completed"
          ? "Update Complete!"
          : status.status === "failed"
            ? "Update Failed"
            : "Updating 4Paws..."}
      </h3>

      {/* Status Message */}
      <p className="mb-6 text-gray-600 dark:text-gray-400">{status.message}</p>

      {/* Progress Bar */}
      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
          style={{ width: `${status.progress}%` }}
        />
      </div>

      {/* Progress Percentage */}
      <p className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{status.progress}%</p>

      {/* Additional Info */}
      {status.status !== "completed" && status.status !== "failed" && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please wait, this may take a few minutes...
          <br />
          <span className="text-xs">Do not close this window</span>
        </p>
      )}

      {status.status === "completed" && (
        <div className="mt-4">
          <p className="animate-pulse font-semibold text-green-600 dark:text-green-400">
            Reloading application in 2 seconds...
          </p>
          <div className="mt-3 flex items-center justify-center gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-green-500" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-green-500" style={{ animationDelay: "150ms" }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-green-500" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      )}

      {status.status === "failed" && (
        <p className="mt-4 text-red-600 dark:text-red-400">Please check the agent logs and try again.</p>
      )}
    </div>
  );
}
