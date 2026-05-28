"use client";

import { FormEvent, useState } from "react";

type AuthMode = "login" | "signup";

type AuthResponse = {
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
};

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/demo-auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup"
            ? {
                full_name: fullName,
                email,
              }
            : {
                email,
              },
        ),
      });

      const data = await readAuthResponse(response);

      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? `Request failed with status ${response.status}.`);
        return;
      }

      setMessageTone("success");
      setMessage(data.message ?? (mode === "signup" ? "Sign up successful. Click Login to continue." : "Login successful."));

      if (mode === "signup") {
        setMode("login");
        return;
      }

      window.location.assign("/dashboard");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-md bg-slate-950 p-1">
        <button
          className={`rounded px-3 py-2 text-sm font-semibold ${
            mode === "signup" ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-white/10"
          }`}
          onClick={() => {
            setMode("signup");
            setMessage("");
          }}
          type="button"
        >
          Create account
        </button>
        <button
          className={`rounded px-3 py-2 text-sm font-semibold ${
            mode === "login" ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-white/10"
          }`}
          onClick={() => {
            setMode("login");
            setMessage("");
          }}
          type="button"
        >
          Login
        </button>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        {mode === "signup" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="fullName">
              Name
            </label>
            <input
              autoComplete="name"
              className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-slate-100 outline-none focus:border-cyan-300"
              id="fullName"
              onChange={(event) => setFullName(event.target.value)}
              required
              type="text"
              value={fullName}
            />
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
            Email
          </label>
          <input
            autoComplete="email"
            className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-slate-100 outline-none focus:border-cyan-300"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        {message ? (
          <p
            className={`rounded-md px-3 py-2 text-sm ${
              messageTone === "success" ? "bg-emerald-500/10 text-emerald-200" : "bg-rose-500/10 text-rose-200"
            }`}
          >
            {message}
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Please wait..." : mode === "signup" ? "Sign up" : "Login"}
        </button>
      </form>
    </div>
  );
}

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as AuthResponse;
  } catch {
    return {
      error: text,
    };
  }
}
