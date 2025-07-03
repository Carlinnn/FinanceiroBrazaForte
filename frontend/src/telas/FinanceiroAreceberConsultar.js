import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy, doc, updateDoc, where } from "firebase/firestore";
import { app } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";

function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function baixarCSV(parcelas, conta) {
  const header = "Nº,Valor,Vencimento,Status\n";
  const rows = parcelas.map(p => `${p.numero},${p.valor},${p.vencimento},${p.status}`).join("\n");
  const csv = header + rows;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `conta_areceber_${conta.id}_parcelas.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function FinanceiroAreceberConsultar() {
  const [contas, setContas] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showToast, setShowToast] = useState(false);
  const [modal, setModal] = useState({ open: false, conta: null });
  const [baixaLoading, setBaixaLoading] = useState(false);

  const db = getFirestore(app);

  useEffect(() => {
    buscarContas();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (message.text) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const buscarContas = async () => {
    setLoading(true);
    try {
      const contasRef = collection(db, "contasAreceber");
      const q = query(contasRef, orderBy("id", "asc"));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => doc.data());
      setContas(lista);
      if (lista.length === 0) {
        setMessage({ type: "info", text: "Nenhuma conta cadastrada." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Erro ao buscar contas." });
    } finally {
      setLoading(false);
    }
  };

  const contasFiltradas = contas.filter(c =>
    c.cliente.toLowerCase().includes(busca.toLowerCase()) ||
    c.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  // Função para dar baixa em uma parcela
  const darBaixaParcela = async (conta, idxParcela) => {
    setBaixaLoading(true);
    try {
      // Buscar o doc do Firestore pelo id
      const contasRef = collection(db, "contasAreceber");
      const q = query(contasRef, where("id", "==", conta.id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = doc(db, "contasAreceber", snapshot.docs[0].id);
        const contaFirestore = snapshot.docs[0].data();
        // Atualizar o status da parcela
        const novasParcelas = contaFirestore.parcelas.map((p, i) =>
          i === idxParcela ? { ...p, status: "Recebido" } : p
        );
        // Se todas as parcelas estiverem recebidas, atualizar status geral
        const statusGeral = novasParcelas.every(p => p.status === "Recebido") ? "Recebido" : contaFirestore.status;
        await updateDoc(docRef, {
          parcelas: novasParcelas,
          status: statusGeral
        });
        // Atualizar na interface
        setModal(m => ({ ...m, conta: { ...m.conta, parcelas: novasParcelas, status: statusGeral } }));
        setContas(cs => cs.map(c => c.id === conta.id ? { ...c, parcelas: novasParcelas, status: statusGeral } : c));
        setMessage({ type: "success", text: "Parcela recebida com sucesso!" });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Erro ao receber parcela." });
    } finally {
      setBaixaLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Toast de mensagem */}
      <div aria-live="polite" aria-atomic="true" style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}>
        <div className={`toast show align-items-center text-bg-${message.type || "primary"} border-0${showToast ? "" : " d-none"}`} role="alert">
          <div className="d-flex">
            <div className="toast-body">{message.text}</div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={() => setShowToast(false)}></button>
          </div>
        </div>
      </div>
      <div className="card bg-dark text-white shadow-lg border-0 animate__animated animate__fadeInUp">
        <div className="card-body p-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
            <h3 className="text-white fw-bold text-uppercase letter-spacing-1 mb-0">Consulta de Contas a Receber</h3>
            <div className="input-group" style={{ maxWidth: 320 }}>
              <span className="input-group-text bg-black text-white border-secondary">🔎</span>
              <input
                type="text"
                className="form-control bg-black text-white border-secondary shadow-sm"
                placeholder="Buscar por Cliente ou Descrição"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center text-white py-5">
              <div className="spinner-border text-light mb-3" role="status"></div>
              <div>Carregando contas...</div>
            </div>
          ) : contasFiltradas.length === 0 ? (
            <div className="alert alert-info text-center">Nenhuma conta encontrada.</div>
          ) : (
            <div className="table-responsive animate__animated animate__fadeIn">
              <table className="table table-dark table-hover align-middle rounded overflow-hidden">
                <thead className="table-secondary text-dark">
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Valor Total</th>
                    <th>1º Vencimento</th>
                    <th>Situação</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contasFiltradas.map((c, idx) => (
                    <tr key={c.id || idx} className="align-middle">
                      <td>{c.id}</td>
                      <td>{c.cliente}</td>
                      <td>R$ {c.valor.toFixed(2)}</td>
                      <td>{formatarDataBR(c.dataVencimento)}</td>
                      <td>
                        <span className={`badge ${c.status === "Pendente" ? "bg-warning text-dark" : c.status === "Recebido" ? "bg-success" : "bg-danger"}`}>{c.status}</span>
                      </td>
                      <td>
                        <button className="btn btn-outline-light btn-sm" onClick={() => setModal({ open: true, conta: c })}>Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Modal de detalhes */}
      {modal.open && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Detalhes da Conta a Receber #{modal.conta.id}</h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setModal({ open: false, conta: null })}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6 mb-2">
                    <strong>Cliente:</strong> {modal.conta.cliente}
                  </div>
                  <div className="col-md-6 mb-2">
                    <strong>Descrição:</strong> {modal.conta.descricao}
                  </div>
                  <div className="col-md-4 mb-2">
                    <strong>Valor Total:</strong> R$ {modal.conta.valor.toFixed(2)}
                  </div>
                  <div className="col-md-4 mb-2">
                    <strong>Recebimento:</strong> {modal.conta.formaRecebimento}
                  </div>
                  <div className="col-md-4 mb-2">
                    <strong>Parcelas:</strong> {modal.conta.numParcelas}
                  </div>
                  <div className="col-md-6 mb-2">
                    <strong>1º Vencimento:</strong> {formatarDataBR(modal.conta.dataVencimento)}
                  </div>
                  <div className="col-md-6 mb-2">
                    <strong>Status:</strong> <span className={`badge ${modal.conta.status === "Pendente" ? "bg-warning text-dark" : modal.conta.status === "Recebido" ? "bg-success" : "bg-danger"}`}>{modal.conta.status}</span>
                  </div>
                  {modal.conta.observacoes && (
                    <div className="col-12 mb-2">
                      <strong>Observações:</strong> {modal.conta.observacoes}
                    </div>
                  )}
                </div>
                <h6 className="fw-bold mt-4 mb-2">Parcelas</h6>
                <div className="table-responsive animate__animated animate__fadeIn">
                  <table className="table table-dark table-hover align-middle rounded overflow-hidden">
                    <thead className="table-secondary text-dark">
                      <tr>
                        <th>Nº</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {modal.conta.parcelas.map((p, idx) => (
                        <tr key={idx} className="align-middle">
                          <td>{p.numero}</td>
                          <td>R$ {p.valor.toFixed(2)}</td>
                          <td>{formatarDataBR(p.vencimento)}</td>
                          <td><span className={`badge ${p.status === "Pendente" ? "bg-warning text-dark" : p.status === "Recebido" ? "bg-success" : "bg-danger"}`}>{p.status}</span></td>
                          <td>
                            {p.status !== "Recebido" && (
                              <button className="btn btn-success btn-sm" disabled={baixaLoading} onClick={() => darBaixaParcela(modal.conta, idx)}>
                                Dar baixa
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-outline-light" onClick={() => baixarCSV(modal.conta.parcelas, modal.conta)}>Baixar Parcelas (CSV)</button>
                <button className="btn btn-secondary" onClick={() => setModal({ open: false, conta: null })}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceiroAreceberConsultar; 