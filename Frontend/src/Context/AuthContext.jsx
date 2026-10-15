import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axiosInstance from "../Utils/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [savedOpportunities, setSavedOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(() =>
    Boolean(localStorage.getItem("accessToken"))
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTarget, setAuthModalTarget] = useState(null);

  const hasToken = useCallback(
    () => Boolean(localStorage.getItem("accessToken")),
    []
  );

  const openAuthModal = useCallback(
    (target) => {
      if (isAuthed) return;
      setAuthModalTarget(target || null);
      setAuthModalOpen(true);
    },
    [isAuthed]
  );

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthModalTarget(null);
  }, []);

  const loadSaved = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/students/saved-opportunities/");
      setSavedOpportunities(Array.isArray(data) ? data : []);
    } catch {
      setSavedOpportunities([]);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    if (!hasToken()) {
      setProfile(null);
      setReady(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get("/students/profile/");
      setProfile(data);
      // Cache only for non-authoritative quick display (navbar initials).
      localStorage.setItem("uniguide_user_name", data.full_name || "");
      localStorage.setItem("uniguide_user_email", data.email || "");
      await loadSaved();
    } catch (e) {
      // Never fall back to fake/demo data — surface the error instead.
      setProfile(null);
      setIsAuthed(false);
      setError(
        e?.response?.data?.detail ||
          e?.response?.data?.error ||
          "Failed to load your profile."
      );
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [hasToken, loadSaved]);

  // Load profile once on mount and whenever the access token appears.
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (tokens) => {
      localStorage.setItem("accessToken", tokens.access_token);
      localStorage.setItem("refreshToken", tokens.refresh_token);
      setIsAuthed(true);
      await loadProfile().catch(() => {});
    },
    [loadProfile]
  );

  const updateProfile = useCallback(
    async (payload) => {
      const { data } = await axiosInstance.put("/students/profile/", payload);
      setProfile((prev) => ({ ...prev, ...data }));
      return data;
    },
    []
  );

  const addSkill = useCallback(async (payload) => {
    const { data } = await axiosInstance.post("/students/skills/add/", payload);
    setProfile((prev) => {
      if (!prev) return prev;
      const skills = Array.isArray(prev.skills) ? prev.skills : [];
      const exists = skills.find((s) => s.id === data.id);
      return {
        ...prev,
        skills: exists
          ? skills.map((s) => (s.id === data.id ? data : s))
          : [...skills, data],
      };
    });
    return data;
  }, []);

  const deleteSkill = useCallback(async (id) => {
    await axiosInstance.delete(`/students/skills/${id}/`);
    setProfile((prev) => {
      if (!prev) return prev;
      const skills = Array.isArray(prev.skills) ? prev.skills : [];
      return { ...prev, skills: skills.filter((s) => s.id !== id) };
    });
  }, []);

  const saveOpportunity = useCallback(async (payload) => {
    const { data } = await axiosInstance.post(
      "/students/saved-opportunities/",
      payload
    );
    setSavedOpportunities((prev) => {
      if (prev.find((o) => o.id === data.id)) return prev;
      return [data, ...prev];
    });
    return data;
  }, []);

  const removeOpportunity = useCallback(async (id) => {
    await axiosInstance.delete(`/students/saved-opportunities/${id}/`);
    setSavedOpportunities((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const changePassword = useCallback(async (payload) => {
    const { data } = await axiosInstance.post(
      "/auth/change-password/",
      payload
    );
    return data;
  }, []);

  const loggingOutRef = useRef(false);

  const logout = useCallback(async () => {
    // Guard against duplicate requests from repeated clicks.
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;

    // Read the refresh token BEFORE clearing storage or the request would be
    // sent without (or against a blacklisted) credential.
    const refreshToken = localStorage.getItem("refreshToken");

    // Bound the best-effort revoke so a stalled request can never block local
    // sign-out.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      if (refreshToken) {
        await axiosInstance.post(
          "/auth/logout/",
          { refresh_token: refreshToken },
          { signal: controller.signal }
        );
      }
    } catch {
      // Best-effort: a failed revoke must never block local sign-out. Errors
      // (and tokens) are never logged.
    } finally {
      clearTimeout(timeout);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("uniguide_user_name");
      localStorage.removeItem("uniguide_user_email");
      setProfile(null);
      setSavedOpportunities([]);
      setIsAuthed(false);
      window.location.assign("/");
    }
  }, []);

  const value = {
    profile,
    user: profile
      ? {
          full_name: profile.full_name,
          email: profile.email,
          profile_picture: profile.profile_picture,
        }
      : null,
    skills: profile?.skills || [],
    savedOpportunities,
    loading,
    error,
    ready,
    isAuthenticated: isAuthed,
    login,
    authModalOpen,
    authModalTarget,
    openAuthModal,
    closeAuthModal,
    loadProfile,
    updateProfile,
    addSkill,
    deleteSkill,
    saveOpportunity,
    removeOpportunity,
    changePassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
