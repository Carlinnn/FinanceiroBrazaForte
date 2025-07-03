import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (message.text) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validateEmail = (email) => {
    // Regex simples para validação de e-mail
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    if (!email || !password) {
      setMessage({ type: "danger", text: "Preencha todos os campos." });
      return;
    }
    if (!validateEmail(email)) {
      setMessage({ type: "danger", text: "E-mail inválido." });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "danger", text: "A senha deve ter pelo menos 6 caracteres." });
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      setMessage({ type: "success", text: "Login realizado com sucesso! Redirecionando..." });
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setMessage({ type: "danger", text: "E-mail ou senha incorretos." });
      } else if (err.code === "auth/too-many-requests") {
        setMessage({ type: "warning", text: "Muitas tentativas. Tente novamente mais tarde." });
      } else {
        setMessage({ type: "danger", text: "Erro ao fazer login. Tente novamente." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-vh-100 d-flex align-items-center justify-content-center">
      {/* Toast de mensagem */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
      >
        <div
          className={`toast show align-items-center text-bg-${message.type || "primary"} border-0${showToast ? "" : " d-none"}`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">
              {message.text}
            </div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              aria-label="Close"
              onClick={() => setShowToast(false)}
            ></button>
          </div>
        </div>
      </div>
      <div className="card bg-dark text-white p-4 shadow" style={{minWidth: '350px', maxWidth: '90vw'}}>
        <h2 className="text-center mb-4">Login</h2>
        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="mb-3">
            <label htmlFor="email" className="form-label">E-mail</label>
            <input
              type="email"
              className="form-control bg-black text-white border-secondary"
              id="email"
              placeholder="Digite seu e-mail"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Senha</label>
            <input
              type="password"
              className="form-control bg-black text-white border-secondary"
              id="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-light w-100 fw-bold" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login; 