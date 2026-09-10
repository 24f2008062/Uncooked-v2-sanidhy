"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import jsQR from "jsqr";
import {
  QrCode,
  Camera,
  CameraOff,
  SwitchCamera,
  Zap,
  ZapOff,
  Volume2,
  VolumeX,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  UserCheck,
  RotateCcw,
  Loader2,
  Check,
  X,
  Clock,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountNav from "@/components/account/AccountNav";

const FIELD =
  "w-full bg-[#14141c] border border-[#242432] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500";

function parsePassPayload(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return {
      registrationId: String(parsed.regId || parsed.registrationId || "").trim(),
      eventId: String(parsed.eventId || "").trim(),
      userId: String(parsed.userId || "").trim(),
      sig: String(parsed.sig || "").trim(),
    };
  } catch {
    return null;
  }
}

// Synthesize pleasant sound effects with zero external audio assets
function playAudioTone(type = "success") {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "success") {
      // Pleasant rising chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "warning") {
      // Double pulse
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Low alert buzz
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    // Audio context may be restricted before user interaction
  }
}

export default function HostScannerPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.eventId || "");

  // Main Event State
  const [eventData, setEventData] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0, capacity: 100, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navigation Tabs: "camera" | "roster" | "manual"
  const [activeTab, setActiveTab] = useState("camera");

  // Camera & Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scan Verification State
  const [busy, setBusy] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  // Manual code input state
  const [rawManual, setRawManual] = useState("");

  // Roster filters
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterFilter, setRosterFilter] = useState("all"); // "all" | "checked" | "pending"

  // DOM Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const isProcessingRef = useRef(false);
  const barcodeDetectorRef = useRef(null);

  // Load Event & Attendee List from Server
  const fetchCheckInData = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/check-in`);
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push(`/login?redirectTo=/host/scanner/${encodeURIComponent(eventId)}`);
        return;
      }
      if (!res.ok) {
        setError(payload.error?.message || "Failed to load door scanner data.");
        return;
      }
      const data = payload.data || payload;
      setEventData(data.event || null);
      setStats(data.stats || { total: 0, checkedIn: 0, pending: 0, capacity: 100, percentage: 0 });
      setAttendees(data.attendees || []);
    } catch {
      setError("Unable to connect to check-in service.");
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchCheckInData();
  }, [fetchCheckInData]);

  // Execute Check-In on Backend
  const executeCheckIn = useCallback(async (payload) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resultJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (soundEnabled) playAudioTone("error");
        if (soundEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        setScanResult({
          status: "error",
          message: resultJson.error?.message || "Check-in verification failed.",
        });
        return;
      }

      const data = resultJson.data || resultJson;

      if (data.alreadyCheckedIn) {
        if (soundEnabled) playAudioTone("warning");
        if (soundEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([150, 80, 150]);
        }
        setScanResult({
          status: "already_checked_in",
          guestName: data.guestName || "Guest",
          guestEmail: data.guestEmail || "",
          registrationId: data.registrationId,
          message: "Pass was already redeemed earlier.",
        });
      } else {
        if (soundEnabled) playAudioTone("success");
        if (soundEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([80, 40, 80]);
        }
        setScanResult({
          status: "success",
          guestName: data.guestName || "Guest",
          guestEmail: data.guestEmail || "",
          registrationId: data.registrationId,
          checkedInAt: data.checkedInAt || new Date().toISOString(),
        });

        // Update local attendees list immediately
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === data.registrationId
              ? { ...a, checkInStatus: true, status: "CheckedIn", updatedAt: new Date().toISOString() }
              : a
          )
        );

        // Record in recent check-ins log
        setRecentCheckIns((prev) => [
          {
            id: data.registrationId,
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          },
          ...prev.slice(0, 9),
        ]);

        // Update real-time stats
        setStats((prev) => {
          const nextChecked = prev.checkedIn + 1;
          const total = Math.max(prev.total, nextChecked);
          return {
            ...prev,
            checkedIn: nextChecked,
            pending: Math.max(0, total - nextChecked),
            percentage: total > 0 ? Math.round((nextChecked / total) * 100) : 0,
          };
        });
      }
    } catch {
      if (soundEnabled) playAudioTone("error");
      setScanResult({
        status: "error",
        message: "Network or server connection error. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }, [eventId, soundEnabled]);

  // Handle Undo Check-In
  const handleUndoCheckIn = async (registrationId) => {
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, action: "undo" }),
      });
      if (res.ok) {
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === registrationId ? { ...a, checkInStatus: false, status: "Confirmed" } : a
          )
        );
        setStats((prev) => {
          const nextChecked = Math.max(0, prev.checkedIn - 1);
          return {
            ...prev,
            checkedIn: nextChecked,
            pending: prev.total - nextChecked,
            percentage: prev.total > 0 ? Math.round((nextChecked / prev.total) * 100) : 0,
          };
        });
        setRecentCheckIns((prev) => prev.filter((item) => item.id !== registrationId));
      }
    } catch (err) {
      console.error("Failed to undo check-in:", err);
    }
  };

  // Decode Pass and Trigger Check-In
  const handleDecodedPass = useCallback((scannedRaw) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const pass = parsePassPayload(scannedRaw);
    if (!pass?.registrationId) {
      // Check if raw string matches an attendee ID directly
      const match = attendees.find(
        (a) => a.id === scannedRaw || a.id.toLowerCase() === scannedRaw.toLowerCase()
      );
      if (match) {
        executeCheckIn({ registrationId: match.id, manual: true });
        return;
      }

      if (soundEnabled) playAudioTone("error");
      setScanResult({
        status: "error",
        message: "QR code unrecognized or not an Uncooked event pass.",
        raw: scannedRaw,
      });
      return;
    }

    if (pass.eventId && pass.eventId !== eventId) {
      if (soundEnabled) playAudioTone("error");
      setScanResult({
        status: "error",
        message: "This pass belongs to a different event.",
        pass,
      });
      return;
    }

    executeCheckIn({
      registrationId: pass.registrationId,
      userId: pass.userId,
      sig: pass.sig,
    });
  }, [attendees, eventId, executeCheckIn, soundEnabled]);

  // Stop Camera Streams
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Frame Scanning Loop (Hardware BarcodeDetector + jsQR fallback)
  const startScanningLoop = useCallback(() => {
    if (typeof window === "undefined") return;

    if ("BarcodeDetector" in window && !barcodeDetectorRef.current) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        barcodeDetectorRef.current = null;
      }
    }

    const scanFrame = async () => {
      if (!videoRef.current || !streamRef.current) return;

      if (!isProcessingRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;

        // 1. Fast path: native hardware acceleration
        if (barcodeDetectorRef.current) {
          try {
            const codes = await barcodeDetectorRef.current.detect(video);
            if (codes && codes.length > 0 && codes[0]?.rawValue) {
              handleDecodedPass(codes[0].rawValue);
              return;
            }
          } catch {
            // Fall back to jsQR
          }
        }

        // 2. Universal path: jsQR canvas processing
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = Math.min(640, video.videoWidth);
            canvas.height = Math.min(480, video.videoHeight);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              handleDecodedPass(code.data);
              return;
            }
          }
        }
      }

      scanLoopRef.current = requestAnimationFrame(scanFrame);
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);
  }, [handleDecodedPass]);

  // Start Camera
  const startCamera = useCallback(async (targetFacing = "environment") => {
    stopCamera();
    setCameraError(null);
    setIsCameraStarting(true);
    try {
      const constraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check for torch/flashlight capability
      const track = stream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const caps = track.getCapabilities();
        setTorchSupported(Boolean(caps.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      isProcessingRef.current = false;
      startScanningLoop();
    } catch (err) {
      console.error("Camera access failure:", err);
      let msg = "Could not activate camera. Please check your browser permissions.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in browser site settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No camera hardware was detected on this device.";
      }
      setCameraError(msg);
      setIsCameraActive(false);
    } finally {
      setIsCameraStarting(false);
    }
  }, [startScanningLoop, stopCamera]);

  // Toggle Front/Rear Camera
  const handleToggleFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({ advanced: [{ torch: nextState }] });
        setTorchOn(nextState);
      } catch (err) {
        console.warn("Unable to toggle torch:", err);
      }
    }
  };

  // Resume Scanner after showing verification result
  const handleScanNext = useCallback(() => {
    setScanResult(null);
    isProcessingRef.current = false;
    if (isCameraActive && !scanLoopRef.current) {
      startScanningLoop();
    }
  }, [isCameraActive, startScanningLoop]);

  // Auto-resume camera scanning after success card
  useEffect(() => {
    if (scanResult && activeTab === "camera") {
      const timer = setTimeout(() => {
        handleScanNext();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [scanResult, activeTab, handleScanNext]);

  // Manage camera lifecycle when switching tabs or toggling facing mode
  useEffect(() => {
    if (activeTab === "camera") {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, facingMode, startCamera, stopCamera]);

  // Manual Form Submission
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const pass = parsePassPayload(rawManual);
    if (pass?.registrationId) {
      await executeCheckIn({
        registrationId: pass.registrationId,
        userId: pass.userId,
        sig: pass.sig,
      });
    } else {
      // Direct pass ID manual input
      const code = rawManual.trim();
      if (!code) return;
      await executeCheckIn({ registrationId: code, manual: true });
    }
    setRawManual("");
  };

  // Filtered Roster Attendees
  const filteredAttendees = useMemo(() => {
    return attendees.filter((att) => {
      const matchesSearch =
        !rosterSearch ||
        att.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        att.email.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        att.id.toLowerCase().includes(rosterSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (rosterFilter === "checked") return att.checkInStatus;
      if (rosterFilter === "pending") return !att.checkInStatus;
      return true;
    });
  }, [attendees, rosterSearch, rosterFilter]);

  return (
    <>
      <Navbar forceDarkTop />
      <main className="min-h-screen bg-[#0a0a0f] text-gray-100 pt-24 pb-24 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-amber-500/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <AccountNav />

          {/* Header Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e1e28] pb-4">
            <div>
              <Link
                href={`/events/${eventId}`}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 transition mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Event Details
              </Link>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <QrCode className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {loading ? "Loading Scanner..." : eventData?.title || "Door Pass Scanner"}
                  </h1>
                  <p className="text-xs text-gray-400">
                    Host Control Desk &bull; Camera Pass Scanner & Attendee Roster
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-3 bg-[#12121a] border border-[#20202c] px-4 py-2.5 rounded-2xl shadow-lg self-start sm:self-auto">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Checked In</p>
                <p className="text-sm font-bold text-amber-400 font-mono">
                  {stats.checkedIn} <span className="text-gray-500 font-normal">/ {stats.total} guests</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-mono text-xs font-bold text-amber-400">
                {stats.percentage}%
              </div>
            </div>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-[#12121a] p-1.5 rounded-2xl border border-[#20202c]">
            <button
              onClick={() => setActiveTab("camera")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "camera"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera Scanner</span>
              {isCameraActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("roster")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "roster"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Attendee Roster</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-[#1a1a26] text-gray-300">
                {stats.checkedIn}/{stats.total}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "manual"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Manual Entry</span>
            </button>
          </div>

          {/* TAB 1: CAMERA SCANNER */}
          {activeTab === "camera" && (
            <div className="space-y-6">
              {/* Live Camera Viewfinder Box */}
              <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-[#20202c] shadow-2xl min-h-[360px] sm:min-h-[460px] flex items-center justify-center">
                {/* Offscreen Canvas for Frame Decoding */}
                <canvas ref={canvasRef} className="hidden" />

                {/* HTML5 Video Element */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover max-h-[520px] ${
                    isCameraActive ? "block" : "hidden"
                  }`}
                  muted
                  playsInline
                />

                {/* Camera Inactive / Loading / Error Overlay */}
                {!isCameraActive && (
                  <div className="p-8 text-center space-y-4 max-w-md">
                    {isCameraStarting ? (
                      <div className="space-y-2">
                        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                        <p className="text-xs text-gray-400">Initializing camera lens...</p>
                      </div>
                    ) : cameraError ? (
                      <div className="space-y-3">
                        <CameraOff className="w-10 h-10 text-red-400 mx-auto" />
                        <p className="text-xs text-red-300">{cameraError}</p>
                        <div className="flex justify-center gap-2 pt-2">
                          <button
                            onClick={() => startCamera(facingMode)}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Try Again
                          </button>
                          <button
                            onClick={() => setActiveTab("manual")}
                            className="px-4 py-2 rounded-xl bg-[#1c1c28] text-gray-300 font-semibold text-xs hover:bg-[#252536] cursor-pointer"
                          >
                            Use Manual Code Entry
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Camera className="w-10 h-10 text-gray-500 mx-auto" />
                        <p className="text-xs text-gray-400">Camera is currently paused.</p>
                        <button
                          onClick={() => startCamera(facingMode)}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 flex items-center gap-2 mx-auto cursor-pointer"
                        >
                          <Camera className="w-4 h-4" /> Start Camera
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Active HUD Scanning Overlay */}
                {isCameraActive && !scanResult && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                    {/* Top HUD Badges */}
                    <div className="flex items-center justify-between pointer-events-auto">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live Scanner Active
                      </span>

                      {/* Controls Bar */}
                      <div className="flex items-center gap-2">
                        {torchSupported && (
                          <button
                            onClick={handleToggleTorch}
                            title={torchOn ? "Turn Off Flashlight" : "Turn On Flashlight"}
                            className={`p-2 rounded-full backdrop-blur-md border transition cursor-pointer ${
                              torchOn
                                ? "bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30"
                                : "bg-black/60 text-white border-white/10 hover:bg-black/80"
                            }`}
                          >
                            {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                          </button>
                        )}

                        <button
                          onClick={handleToggleFacing}
                          title="Flip Camera (Front/Back)"
                          className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition cursor-pointer"
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          title={soundEnabled ? "Mute Audio Chime" : "Enable Audio Chime"}
                          className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition cursor-pointer"
                        >
                          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                        </button>
                      </div>
                    </div>

                    {/* Central Target Reticle & Animated Laser */}
                    <div className="relative w-64 h-64 mx-auto my-auto rounded-2xl border-2 border-amber-400/40 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.15)]">
                      {/* Corner Accents */}
                      <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                      <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                      <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce" />

                      <span className="text-[10px] text-amber-200/60 font-mono tracking-widest uppercase bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        Align QR Pass
                      </span>
                    </div>

                    {/* Bottom HUD Helper */}
                    <div className="text-center pointer-events-auto">
                      <p className="text-xs text-white/80 drop-shadow-md bg-black/40 inline-block px-4 py-1.5 rounded-full backdrop-blur-md">
                        Hold the attendee&apos;s digital ticket pass in front of camera
                      </p>
                    </div>
                  </div>
                )}

                {/* Instant Verification Overlay Modal */}
                <AnimatePresence>
                  {scanResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
                    >
                      <div className="bg-[#14141e] border border-[#2a2a3c] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
                        {scanResult.status === "success" ? (
                          <>
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                Verified Entry
                              </span>
                              <h3 className="text-xl font-bold text-white mt-1">{scanResult.guestName}</h3>
                              {scanResult.guestEmail && (
                                <p className="text-xs text-gray-400">{scanResult.guestEmail}</p>
                              )}
                              <p className="text-[11px] text-gray-500 font-mono mt-1">
                                Pass: {scanResult.registrationId}
                              </p>
                            </div>
                            <button
                              onClick={handleScanNext}
                              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
                            >
                              Scan Next Pass
                            </button>
                          </>
                        ) : scanResult.status === "already_checked_in" ? (
                          <>
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                              <AlertCircle className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                Already Checked In
                              </span>
                              <h3 className="text-xl font-bold text-white mt-1">{scanResult.guestName}</h3>
                              <p className="text-xs text-amber-300/80">{scanResult.message}</p>
                              <p className="text-[11px] text-gray-500 font-mono mt-1">
                                Pass: {scanResult.registrationId}
                              </p>
                            </div>
                            <button
                              onClick={handleScanNext}
                              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
                            >
                              Scan Next Pass
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
                              <X className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                Pass Rejected
                              </span>
                              <h3 className="text-base font-bold text-white mt-1">Invalid Pass</h3>
                              <p className="text-xs text-red-300">{scanResult.message}</p>
                            </div>
                            <button
                              onClick={handleScanNext}
                              className="w-full py-3 rounded-xl bg-[#222232] hover:bg-[#2c2c40] text-gray-200 font-bold text-xs transition cursor-pointer"
                            >
                              Dismiss & Try Again
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Recent Activity Mini-Feed */}
              {recentCheckIns.length > 0 && (
                <div className="bg-[#12121a] border border-[#20202c] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Recent Door Activity</span>
                    </p>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {recentCheckIns.length} verified this session
                    </span>
                  </div>

                  <div className="space-y-2">
                    {recentCheckIns.slice(0, 4).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#161622] border border-[#222232] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-bold text-white truncate">{item.guestName}</span>
                          {item.guestEmail && (
                            <span className="text-gray-500 truncate text-[11px]">({item.guestEmail})</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 shrink-0 ml-2">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE ATTENDEE ROSTER */}
          {activeTab === "roster" && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="bg-[#12121a] border border-[#20202c] p-4 rounded-2xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search attendee by name, email, or pass ID..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full bg-[#181824] border border-[#262638] focus:border-amber-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none transition"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#181824] p-1 rounded-xl border border-[#262638] text-xs">
                  <button
                    onClick={() => setRosterFilter("all")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      rosterFilter === "all" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    All ({attendees.length})
                  </button>
                  <button
                    onClick={() => setRosterFilter("checked")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      rosterFilter === "checked" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Checked In ({stats.checkedIn})
                  </button>
                  <button
                    onClick={() => setRosterFilter("pending")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      rosterFilter === "pending" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Pending ({stats.pending})
                  </button>
                </div>
              </div>

              {/* Attendee Cards List */}
              <div className="bg-[#12121a] border border-[#20202c] rounded-2xl divide-y divide-[#1e1e28] overflow-hidden shadow-xl">
                {filteredAttendees.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-500 italic">
                    No attendees match current search or filter criteria.
                  </div>
                ) : (
                  filteredAttendees.map((att) => (
                    <div
                      key={att.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161622] transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{att.name}</p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              att.checkInStatus
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-gray-500/10 border-gray-500/20 text-gray-400"
                            }`}
                          >
                            {att.checkInStatus ? "Checked In" : "Pending Entry"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {att.email} {att.department ? `• ${att.department}` : ""}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500">
                          Pass: {att.id} &bull; Registered {new Date(att.registeredAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Manual Action Button */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {!att.checkInStatus ? (
                          <button
                            onClick={() => executeCheckIn({ registrationId: att.id, manual: true })}
                            disabled={busy}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Check In</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUndoCheckIn(att.id)}
                            title="Undo Check-In"
                            className="px-3 py-2 rounded-xl bg-[#1e1e2c] hover:bg-red-500/20 text-gray-300 hover:text-red-400 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Undo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL INPUT FALLBACK */}
          {activeTab === "manual" && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleManualSubmit}
              className="rounded-3xl bg-[#12121a] border border-[#20202c] p-6 sm:p-8 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>HMAC signature verification enabled &bull; Host or admin only</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Paste Pass JSON or Ticket Registration ID
                </label>
                <textarea
                  className={`${FIELD} min-h-[120px] font-mono text-xs`}
                  value={rawManual}
                  onChange={(e) => setRawManual(e.target.value)}
                  placeholder='{"regId":"reg_...","eventId":"...","userId":"...","sig":"..."} or enter pass ID'
                />
              </div>

              <button
                type="submit"
                disabled={busy || !rawManual.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Verify and Check In
                  </>
                )}
              </button>
            </motion.form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
