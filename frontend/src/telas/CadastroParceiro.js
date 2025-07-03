import React, { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { app } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaRegBuilding, FaIdCard, FaPhoneAlt } from "react-icons/fa";

function CadastroParceiro() {
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [telefone, setTelefone] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const db = getFirestore(app);

  useEffect(() => {
    if (message.text) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    if (!cnpj || !razaoSocial || !telefone) {
      setMessage({ type: "danger", text: "Preencha todos os campos." });
      return;
    }
    setLoading(true);
    try {
      // Busca o último ID
      const parceirosRef = collection(db, "parceiros");
      const q = query(parceirosRef, orderBy("id", "desc"), limit(1));
      const snapshot = await getDocs(q);
      let nextId = 1;
      if (!snapshot.empty) {
        const last = snapshot.docs[0].data();
        nextId = last.id + 1;
      }
      await addDoc(parceirosRef, {
        id: nextId,
        cnpj,
        razaoSocial,
        telefone
      });
      setMessage({ type: "success", text: "Parceiro cadastrado com sucesso!" });
      setCnpj("");
      setRazaoSocial("");
      setTelefone("");
    } catch (err) {
      setMessage({ type: "danger", text: "Erro ao cadastrar parceiro." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
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
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card bg-dark text-white shadow-lg border-0 animate__animated animate__fadeInUp">
            <div className="card-body p-5">
              <h3 className="mb-4 fw-bold text-center text-uppercase letter-spacing-1">
                <FaRegBuilding className="me-2 mb-1" />Cadastro de Parceiro
              </h3>
              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="mb-4">
                  <label className="form-label text-white fw-semibold">
                    <FaIdCard className="me-2 mb-1" />CNPJ
                  </label>
                  <input
                    type="text"
                    className="form-control bg-black text-white border-secondary shadow-sm"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    disabled={loading}
                    placeholder="Digite o CNPJ"
                    maxLength={18}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-white fw-semibold">
                    <FaRegBuilding className="me-2 mb-1" />Razão Social
                  </label>
                  <input
                    type="text"
                    className="form-control bg-black text-white border-secondary shadow-sm"
                    value={razaoSocial}
                    onChange={e => setRazaoSocial(e.target.value)}
                    disabled={loading}
                    placeholder="Digite a razão social"
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-white fw-semibold">
                    <FaPhoneAlt className="me-2 mb-1" />Telefone
                  </label>
                  <input
                    type="text"
                    className="form-control bg-black text-white border-secondary shadow-sm"
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    disabled={loading}
                    placeholder="Digite o telefone"
                    maxLength={15}
                  />
                </div>
                <div className="d-grid">
                  <button type="submit" className="btn btn-light fw-bold py-2 fs-5 shadow-sm" disabled={loading}>
                    {loading ? "Salvando..." : "Cadastrar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CadastroParceiro; 