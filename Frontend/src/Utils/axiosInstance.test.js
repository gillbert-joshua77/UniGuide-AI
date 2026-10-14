import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import axiosInstance from "./axiosInstance";

const REFRESH_RE = /\/auth\/token\/refresh\/$/;

function makeJwt(exp) {
  const enc = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${enc({ alg: "none", typ: "JWT" })}.${enc({
    sub: "1",
    exp,
    iat: exp - 3600,
  })}.sig`;
}

const now = Math.floor(Date.now() / 1000);
export const EXPIRED_TOKEN = makeJwt(now - 3600);
export const VALID_TOKEN = makeJwt(now + 3600);
export const NEW_ACCESS = "newAccessToken";
export const REFRESH_TOKEN = "refresh-token";

// Rejects if `p` does not settle within `ms` — turns a hung promise into a
// deterministic test failure instead of a vitest-wide timeout.
function withTimeout(p, ms = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`promise did not settle within ${ms}ms`)),
      ms
    );
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

describe("axiosInstance token refresh", () => {
  let instanceMock;
  let baseMock;
  const originalLocation = typeof window !== 'undefined' ? window.location : undefined;

  beforeEach(() => {
    localStorage.clear();
    const mockLocation = {
      ...originalLocation,
      pathname: "/settings",
      assign: vi.fn(),
    };
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: mockLocation,
    });
    instanceMock = new MockAdapter(axiosInstance);
    baseMock = new MockAdapter(axios);
  });

  afterEach(() => {
    instanceMock?.restore();
    baseMock?.restore();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it("attaches a valid access token and never calls refresh", async () => {
    localStorage.setItem("accessToken", VALID_TOKEN);
    localStorage.setItem("refreshToken", REFRESH_TOKEN);
    instanceMock.onGet("/students/profile/").reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${VALID_TOKEN}`);
      return [200, { ok: true }];
    });

    const { data } = await axiosInstance.get("/students/profile/");

    expect(data.ok).toBe(true);
    expect(baseMock.history.post.length).toBe(0);
  });

  it("sends requests without a token unauthenticated (no refresh attempted)", async () => {
    instanceMock.onGet("/uniguide/news/").reply((config) => {
      expect(config.headers.Authorization).toBeUndefined();
      return [200, { ok: true }];
    });

    const { data } = await axiosInstance.get("/uniguide/news/");

    expect(data.ok).toBe(true);
    expect(baseMock.history.post.length).toBe(0);
  });

  it("completes the FIRST request after expiry instead of hanging (D1)", async () => {
    localStorage.setItem("accessToken", EXPIRED_TOKEN);
    localStorage.setItem("refreshToken", REFRESH_TOKEN);
    baseMock.onPost(REFRESH_RE).reply(200, { access: NEW_ACCESS });
    instanceMock.onGet("/students/profile/").reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${NEW_ACCESS}`);
      return [200, { ok: true }];
    });

    const { data } = await withTimeout(axiosInstance.get("/students/profile/"));

    expect(data.ok).toBe(true);
    expect(localStorage.getItem("accessToken")).toBe(NEW_ACCESS);
    expect(baseMock.history.post.length).toBe(1);
  });

  it("shares a single refresh across concurrent expired requests", async () => {
    localStorage.setItem("accessToken", EXPIRED_TOKEN);
    localStorage.setItem("refreshToken", REFRESH_TOKEN);
    baseMock.onPost(REFRESH_RE).reply(200, { access: NEW_ACCESS });
    instanceMock.onGet("/students/profile/").reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${NEW_ACCESS}`);
      return [200, { ok: true }];
    });

    const [a, b] = await withTimeout(
      Promise.all([
        axiosInstance.get("/students/profile/"),
        axiosInstance.get("/students/profile/"),
      ])
    );

    expect(a.data.ok).toBe(true);
    expect(b.data.ok).toBe(true);
    expect(baseMock.history.post.length).toBe(1);
  });

  it("shares one refresh across simultaneous 401 responses and retries once", async () => {
    localStorage.setItem("accessToken", VALID_TOKEN);
    localStorage.setItem("refreshToken", REFRESH_TOKEN);
    baseMock.onPost(REFRESH_RE).reply(200, { access: NEW_ACCESS });

    let calls = 0;
    instanceMock.onGet("/students/profile/").reply((config) => {
      calls += 1;
      if (calls > 2) {
        expect(config.headers.Authorization).toBe(`Bearer ${NEW_ACCESS}`);
        return [200, { ok: true }];
      }
      return [401, { detail: "Token is invalid or expired" }];
    });

    const [a, b] = await withTimeout(
      Promise.all([
        axiosInstance.get("/students/profile/"),
        axiosInstance.get("/students/profile/"),
      ])
    );

    expect(a.data.ok).toBe(true);
    expect(b.data.ok).toBe(true);
    expect(baseMock.history.post.length).toBe(1);
  });

  it("rejects the request, clears auth state, and redirects when refresh fails (D3)", async () => {
    localStorage.setItem("accessToken", EXPIRED_TOKEN);
    localStorage.setItem("refreshToken", REFRESH_TOKEN);
    baseMock.onPost(REFRESH_RE).reply(401, { detail: "invalid refresh" });
    instanceMock.onGet("/students/profile/").reply(401, { detail: "fail" });

    await expect(withTimeout(axiosInstance.get("/students/profile/"))).rejects.toMatchObject(
      { isAxiosError: true }
    );

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(window.location.assign).toHaveBeenCalled();
  });

  it("rejects all waiting requests (no hang) when a shared refresh fails", async () => {
    localStorage.setItem("accessToken", EXPIRED_TOKEN);
    localStorage.setItem("refreshToken", REFRESH_TOKEN);
    baseMock.onPost(REFRESH_RE).reply(401, { detail: "invalid refresh" });
    instanceMock.onGet("/students/profile/").reply(401, { detail: "fail" });

    const results = await withTimeout(
      Promise.allSettled([
        axiosInstance.get("/students/profile/"),
        axiosInstance.get("/students/profile/"),
      ])
    );

    expect(results[0].status).toBe("rejected");
    expect(results[1].status).toBe("rejected");
    expect(results[0].reason.isAxiosError).toBe(true);
    expect(results[1].reason.isAxiosError).toBe(true);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("does not retry an original request forever (D4)", async () => {
    localStorage.setItem("accessToken", VALID_TOKEN);
    localStorage.setItem("refreshToken", REFRESH_TOKEN);
    baseMock.onPost(REFRESH_RE).reply(200, { access: NEW_ACCESS });

    let calls = 0;
    instanceMock.onGet("/students/profile/").reply(() => {
      calls += 1;
      return [401, { detail: "always 401" }];
    });

    await expect(withTimeout(axiosInstance.get("/students/profile/"))).rejects.toThrow();

    expect(baseMock.history.post.length).toBe(1);
    expect(calls).toBe(2);
  });

  it("preserves a FormData body and lets the browser set the boundary across refresh (D5)", async () => {
    localStorage.setItem("accessToken", EXPIRED_TOKEN);
    localStorage.setItem("refreshToken", REFRESH_TOKEN);
    baseMock.onPost(REFRESH_RE).reply(200, { access: NEW_ACCESS });

    const fd = new FormData();
    fd.append("profile_picture", new File(["x"], "a.png", { type: "image/png" }));
    fd.append("bio", "hello");

    let seenBody;
    instanceMock.onPut("/students/profile/").reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${NEW_ACCESS}`);
      expect(config.data).toBeInstanceOf(FormData);
      seenBody = config.data;
      return [200, { ok: true }];
    });

    const { data } = await withTimeout(axiosInstance.put("/students/profile/", fd));

    expect(data.ok).toBe(true);
    expect(seenBody).toBe(fd);
    expect(baseMock.history.post.length).toBe(1);
  });

  it("preserves JSON body, query params, and headers across a refresh retry", async () => {
    localStorage.setItem("accessToken", EXPIRED_TOKEN);
    localStorage.setItem("refreshToken", REFRESH_TOKEN);
    baseMock.onPost(REFRESH_RE).reply(200, { access: NEW_ACCESS });

    instanceMock.onPost("/uniguide/chat/").reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${NEW_ACCESS}`);
      expect(config.headers["X-Source"]).toBe("test");
      expect(config.params).toEqual({ category: "x", page: 2 });
      expect(config.data).toBe(JSON.stringify({ message: "hello", session_id: "abc" }));
      return [200, { ok: true }];
    });

    const { data } = await withTimeout(
      axiosInstance.post(
        "/uniguide/chat/",
        { message: "hello", session_id: "abc" },
        { params: { category: "x", page: 2 }, headers: { "X-Source": "test" } }
      )
    );

    expect(data.ok).toBe(true);
    expect(baseMock.history.post.length).toBe(1);
  });
});