import React, { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { app } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";

const formasPagamento = ["Boleto", "Transferência", "Cartão", "Pix", "Dinheiro"];

function gerarParcelas(valorTotal, numParcelas, dataVencimento) {
  const parcelas = [];
  const valorParcela = Math.round((valorTotal / numParcelas) * 100) / 100;
  let data = new Date(dataVencimento);
  for (let i = 1; i <= numParcelas; i++) {
    const vencimento = new Date(data);
    vencimento.setMonth(data.getMonth() + i - 1);
    parcelas.push({
      numero: i,
      valor: valorParcela,
      vencimento: vencimento.toISOString().slice(0, 10),
      status: "Pendente"
    });
  }
  return parcelas;
}

function FinanceiroApagarCadastrar() {
  const [fornecedor, setFornecedor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [numParcelas, setNumParcelas] = useState(1);
  const [formaPagamento, setFormaPagamento] = useState(formasPagamento[0]);
  const [observacoes, setObservacoes] = useState("");
  const [parcelas, setParcelas] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parceiros, setParceiros] = useState([]);

  const db = getFirestore(app);

  useEffect(() => {
    // Buscar parceiros para o lookup
    async function fetchParceiros() {
      const parceirosRef = collection(db, "parceiros");
      const q = query(parceirosRef, orderBy("razaoSocial", "asc"));
      const snapshot = await getDocs(q);
      setParceiros(snapshot.docs.map(doc => doc.data()));
    }
    fetchParceiros();
  }, [db]);

  useEffect(() => {
    if (valor && numParcelas && dataVencimento) {
      setParcelas(gerarParcelas(Number(valor), Number(numParcelas), dataVencimento));
    } else {
      setParcelas([]);
    }
  }, [valor, numParcelas, dataVencimento]);

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
    if (!fornecedor || !descricao || !valor || !dataVencimento || !numParcelas || !formaPagamento) {
      setMessage({ type: "danger", text: "Preencha todos os campos obrigatórios." });
      return;
    }
    setLoading(true);
    try {
      // Busca o último ID
      const contasRef = collection(db, "contasApagar");
      const q = query(contasRef, orderBy("id", "desc"), limit(1));
      const snapshot = await getDocs(q);
      let nextId = 1;
      if (!snapshot.empty) {
        const last = snapshot.docs[0].data();
        nextId = last.id + 1;
      }
      await addDoc(contasRef, {
        id: nextId,
        fornecedor,
        descricao,
        valor: Number(valor),
        dataVencimento,
        numParcelas: Number(numParcelas),
        formaPagamento,
        observacoes,
        parcelas,
        status: "Pendente",
        criadoEm: new Date().toISOString()
      });
      setMessage({ type: "success", text: "Conta a pagar cadastrada com sucesso!" });
      setFornecedor(""); setDescricao(""); setValor(""); setDataVencimento(""); setNumParcelas(1); setFormaPagamento(formasPagamento[0]); setObservacoes("");
    } catch (err) {
      setMessage({ type: "danger", text: "Erro ao cadastrar conta." });
    } finally {
      setLoading(false);
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
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card bg-dark text-white shadow-lg border-0 animate__animated animate__fadeInUp">
            <div className="card-body p-5">
              <h3 className="mb-4 fw-bold text-center text-uppercase letter-spacing-1">Cadastro de Conta a Pagar</h3>
              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label text-white fw-semibold">Fornecedor *</label>
                    <select className="form-select bg-black text-white border-secondary shadow-sm" value={fornecedor} onChange={e => setFornecedor(e.target.value)} disabled={loading || parceiros.length === 0} required>
                      <option value="">Selecione o fornecedor</option>
                      {parceiros.map((p, idx) => (
                        <option key={p.id || idx} value={p.razaoSocial}>{p.razaoSocial}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-white fw-semibold">Descrição *</label>
                    <input type="text" className="form-control bg-black text-white border-secondary shadow-sm" value={descricao} onChange={e => setDescricao(e.target.value)} disabled={loading} placeholder="Descrição" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white fw-semibold">Valor Total (R$) *</label>
                    <input type="number" min="0" step="0.01" className="form-control bg-black text-white border-secondary shadow-sm" value={valor} onChange={e => setValor(e.target.value)} disabled={loading} placeholder="0,00" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white fw-semibold">Data do 1º Vencimento *</label>
                    <input type="date" className="form-control bg-black text-white border-secondary shadow-sm" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} disabled={loading} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label text-white fw-semibold">Parcelas *</label>
                    <input type="number" min="1" max="36" className="form-control bg-black text-white border-secondary shadow-sm" value={numParcelas} onChange={e => setNumParcelas(e.target.value)} disabled={loading} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label text-white fw-semibold">Pagamento *</label>
                    <select className="form-select bg-black text-white border-secondary shadow-sm" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} disabled={loading}>
                      {formasPagamento.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-white fw-semibold">Observações</label>
                    <textarea className="form-control bg-black text-white border-secondary shadow-sm" value={observacoes} onChange={e => setObservacoes(e.target.value)} disabled={loading} rows={2} placeholder="Observações"></textarea>
                  </div>
                </div>
                {parcelas.length > 0 && (
                  <div className="mt-4">
                    <h6 className="text-white fw-bold mb-2">Parcelas Geradas</h6>
                    <div className="table-responsive animate__animated animate__fadeIn">
                      <table className="table table-dark table-hover align-middle rounded overflow-hidden">
                        <thead className="table-secondary text-dark">
                          <tr>
                            <th>Nº</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parcelas.map((p, idx) => (
                            <tr key={idx} className="align-middle">
                              <td>{p.numero}</td>
                              <td>R$ {p.valor.toFixed(2)}</td>
                              <td>{p.vencimento}</td>
                              <td><span className="badge bg-warning text-dark">{p.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="d-grid mt-4">
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

export default FinanceiroApagarCadastrar; 