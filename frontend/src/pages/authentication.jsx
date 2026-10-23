import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import server from "../utils/environment";

export default function Authentication() {
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");
  const [mode, setMode] = React.useState(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const { handleRegister, handleLogin, handleGoogleLogin } = React.useContext(AuthContext);

  React.useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("token");
    if (token) {
      handleGoogleLogin(token);
      window.history.replaceState({}, "", "/auth");
      return;
    }
    if (oauthError === "google_not_configured") setError("Google sign-in needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the backend environment.");
    else if (oauthError?.startsWith("google_")) setError("Google sign-in could not be completed. Please try again.");
  }, [handleGoogleLogin, oauthError]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") {
        await handleLogin(username.trim(), password);
      } else {
        const result = await handleRegister(name.trim(), username.trim(), password);
        setMessage(result || "Your account is ready. Sign in to continue.");
        changeMode("login");
        setPassword("");
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "We couldn’t complete that request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="authPage">
      <section className="authStory" aria-label="MeetNest introduction">
        <Link className="authBrand" to="/">
          <img src="/meetnest-icon.png" alt="" />
          <span>MeetNest</span>
        </Link>
        <div className="authStoryCopy">
          <span className="eyebrow"><span className="liveDot" /> A calmer way to meet</span>
          <h1>Good conversations<br /><em>start here.</em></h1>
          <p>Come together with clear video, thoughtful tools, and a little more room to focus.</p>
          <div className="authQuote"><span className="quoteMark">“</span><span>Make space for the people who matter.</span><i>MeetNest</i></div>
        </div>
        <div className="authStoryFoot"><span>Private rooms</span><span>·</span><span>Clear conversations</span><span>·</span><span>One simple link</span></div>
      </section>

      <section className="authPanel">
        <Link className="authBack" to="/">← <span>Back to home</span></Link>
        <div className="authFormWrap">
          <span className="eyebrow">YOUR SPACE IS WAITING</span>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="authIntro">{mode === "login" ? "Sign in and pick up right where you left off." : "A few details and you’ll be ready to meet."}</p>

          <div className="authMode" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "selected" : ""} onClick={() => changeMode("login")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "selected" : ""} onClick={() => changeMode("signup")}>Create account</button>
          </div>

          <button className="googleButton" type="button" onClick={() => { window.location.assign(`${server}/api/v1/users/google`); }}>
            <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"/><path fill="#FF3D00" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.9 1.3-4.3 2.1-6.8 2.1-5.2 0-9.7-3.5-11.3-8.2H5.8v5.2A20 20 0 0 0 24 44Z"/><path fill="#4CAF50" d="M12.7 28a12 12 0 0 1 0-7.9v-5.2H5.8a20 20 0 0 0 0 18.3L12.7 28Z"/><path fill="#1976D2" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 14.9l6.9 5.2C14.3 15.4 18.8 12 24 12Z"/></svg>
            Continue with Google
          </button>

          <div className="authDivider"><span>or continue with email</span></div>
          <form className="authForm" onSubmit={submit}>
            {mode === "signup" && <label>Full name<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>}
            <label>Email or username<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="you@example.com" /></label>
            <label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 6 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>
            {message && <p className="authNotice success" role="status">{message}</p>}
            {error && <p className="authNotice error" role="alert">{error}</p>}
            <button className="authSubmit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}<span aria-hidden="true">→</span></button>
          </form>
          <p className="authLegal">By continuing, you agree to keep conversations respectful and secure.</p>
        </div>
      </section>
    </main>
  );
}
