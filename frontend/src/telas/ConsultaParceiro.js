import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaSearch, FaRegBuilding, FaIdCard, FaPhoneAlt } from "react-icons/fa";

function ConsultaParceiro() {
  const [parceiros, setParceiros] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showToast, setShowToast] = useState(false);

  const db = getFirestore(app);

  useEffect(() => {
    buscarParceiros();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (message.text) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const buscarParceiros = async () => {
    setLoading(true);
    try {
      const parceirosRef = collection(db, "parceiros");
      const q = query(parceirosRef, orderBy("id", "asc"));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => doc.data());
      setParceiros(lista);
      if (lista.length === 0) {
        setMessage({ type: "info", text: "Nenhum parceiro cadastrado." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Erro ao buscar parceiros." });
    } finally {
      setLoading(false);
    }
  };

  const parceirosFiltrados = parceiros.filter(p =>
    p.razaoSocial.toLowerCase().includes(busca.toLowerCase()) ||
    p.cnpj.toLowerCase().includes(busca.toLowerCase())
  );

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
      <div className="card bg-dark text-white shadow-lg border-0 animate__animated animate__fadeInUp">
        <div className="card-body p-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
            <h3 className="text-white fw-bold text-uppercase letter-spacing-1 mb-0">
              <FaRegBuilding className="me-2 mb-1" />Consulta de Parceiros
            </h3>
            <div className="input-group" style={{ maxWidth: 320 }}>
              <span className="input-group-text bg-black text-white border-secondary"><FaSearch /></span>
              <input
                type="text"
                className="form-control bg-black text-white border-secondary shadow-sm"
                placeholder="Buscar por Razão Social ou CNPJ"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center text-white py-5">
              <div className="spinner-border text-light mb-3" role="status"></div>
              <div>Carregando parceiros...</div>
            </div>
          ) : parceirosFiltrados.length === 0 ? (
            <div className="alert alert-info text-center">Nenhum parceiro encontrado.</div>
          ) : (
            <div className="table-responsive animate__animated animate__fadeIn">
              <table className="table table-dark table-hover align-middle rounded overflow-hidden">
                <thead className="table-secondary text-dark">
                  <tr>
                    <th><FaIdCard className="mb-1" /> ID</th>
                    <th><FaIdCard className="mb-1" /> CNPJ</th>
                    <th><FaRegBuilding className="mb-1" /> Razão Social</th>
                    <th><FaPhoneAlt className="mb-1" /> Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {parceirosFiltrados.map((p, idx) => (
                    <tr key={p.id || idx} className="align-middle">
                      <td><span className="badge bg-light text-dark fs-6 px-3 py-2 shadow-sm">{p.id}</span></td>
                      <td>{p.cnpj}</td>
                      <td>{p.razaoSocial}</td>
                      <td>{p.telefone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsultaParceiro; 