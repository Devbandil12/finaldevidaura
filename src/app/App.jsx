import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

import SmoothScroll from "../Components/SmoothScroll";
import Loader from "../Components/Loader";
import AppRouter from "./router";
import ThemeSwitcher from "../Components/ThemeSwitcher";

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
const LOG_ERROR_URL = API_BASE ? `${API_BASE}/api/log-error` : "/api/log-error";

function reportError(type, details) {
  try {
    fetch(LOG_ERROR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        details,
        userAgent: navigator.userAgent,
        url: window.location.href,
        time: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn("Failed to report error:", err);
  }
}

if (typeof window !== "undefined") {
  const originalErrorHandler = window.onerror;
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    if (msg.includes("ResizeObserver loop completed with undelivered notifications")) {
      return true;
    }
    const details = {
      message: msg,
      file: url,
      line: lineNo,
      column: columnNo,
      stack: error?.stack || "N/A",
    };
    console.error("Global Error Handler:", details);
    reportError("runtime", details);
    return false;
  };
}

function PostLoginRedirector() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (location.pathname === "/sso-callback") return;
    if (!isLoaded || !isSignedIn) return;

    const target = sessionStorage.getItem("post_login_redirect");
    if (target) {
      if (location.pathname === target) {
        sessionStorage.removeItem("post_login_redirect");
      } else {
        navigate(target, { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, location.pathname, navigate]);
  return null;
}

import { SiteStatusProvider } from "../features/site/SiteStatusProvider";

const App = () => {
  return (
    <Router>
      <SiteStatusProvider>
        <PostLoginRedirector />
        <ThemeSwitcher />
        <Suspense fallback={<Loader text="Loading..." />}>
          <SmoothScroll>
            <AppRouter />
          </SmoothScroll>
        </Suspense>
      </SiteStatusProvider>
    </Router>
  );
};

export default App;