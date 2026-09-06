"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <main style={styles.page}>
      <section style={styles.card} aria-label="Inicio de sesión">
        <div style={styles.brand}>
          <div style={styles.logo}>BARBER G13</div>
          <div style={styles.subtitle}>Sistema de gestión</div>
        </div>

        <div style={styles.heading}>
          <h1 style={styles.title}>Bienvenido</h1>
          <p style={styles.description}>Inicia sesión para acceder al sistema.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            disabled={loading}
            style={styles.input}
          />

          <label style={styles.label} htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            disabled={loading}
            style={styles.input}
          />

          {error ? (
            <div role="alert" style={styles.error}>
              {error}
            </div>
          ) : null}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f6f7f9",
    color: "#172033",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    border: "1px solid #e6e8ed",
    borderRadius: "20px",
    padding: "36px",
    boxShadow: "0 16px 45px rgba(20, 30, 50, 0.08)",
  },
  brand: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logo: {
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "2px",
  },
  subtitle: {
    marginTop: "6px",
    color: "#70798a",
    fontSize: "13px",
  },
  heading: {
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.2,
  },
  description: {
    margin: "8px 0 0",
    color: "#70798a",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
    marginTop: "6px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d9dde5",
    borderRadius: "11px",
    padding: "13px 14px",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
  },
  error: {
    marginTop: "6px",
    borderRadius: "10px",
    padding: "11px 12px",
    background: "#fff1f1",
    border: "1px solid #ffd1d1",
    color: "#b42318",
    fontSize: "13px",
  },
  button: {
    marginTop: "10px",
    border: 0,
    borderRadius: "11px",
    padding: "14px 16px",
    background: "#172033",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
