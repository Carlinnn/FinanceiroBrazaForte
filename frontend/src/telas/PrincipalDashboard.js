import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../firebase";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function getHojeISO() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function PrincipalDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalApagar, setTotalApagar] = useState(0);
  const [totalAreceber, setTotalAreceber] = useState(0);
  const [contasApagar, setContasApagar] = useState([]);
  const [contasAreceber, setContasAreceber] = useState([]);

  const db = getFirestore(app);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const apagarSnap = await getDocs(collection(db, "contasApagar"));
      const areceberSnap = await getDocs(collection(db, "contasAreceber"));
      const apagar = apagarSnap.docs.map(doc => doc.data());
      const areceber = areceberSnap.docs.map(doc => doc.data());
      setContasApagar(apagar);
      setContasAreceber(areceber);
      const todasParcelasApagar = apagar.flatMap(c => c.parcelas || []);
      const todasParcelasAreceber = areceber.flatMap(c => c.parcelas || []);
      const totalApagar = todasParcelasApagar.filter(p => p.status === "Pendente").reduce((acc, p) => acc + (p.valor || 0), 0);
      const totalAreceber = todasParcelasAreceber.filter(p => p.status === "Pendente").reduce((acc, p) => acc + (p.valor || 0), 0);
      setTotalApagar(totalApagar);
      setTotalAreceber(totalAreceber);
      setLoading(false);
    }
    fetchData();
  }, [db]);

  // Gráfico de barras: comparativo mensal
  function getMesAno(dataISO) {
    if (!dataISO) return "";
    const [ano, mes] = dataISO.split("-");
    return `${mes}/${ano}`;
  }
  const meses = Array.from(new Set([
    ...contasApagar.flatMap(c => c.parcelas || []).map(p => getMesAno(p.vencimento)),
    ...contasAreceber.flatMap(c => c.parcelas || []).map(p => getMesAno(p.vencimento))
  ])).filter(Boolean).sort();
  const apagarPorMes = meses.map(m => contasApagar.flatMap(c => c.parcelas || []).filter(p => getMesAno(p.vencimento) === m).reduce((acc, p) => acc + (p.valor || 0), 0));
  const areceberPorMes = meses.map(m => contasAreceber.flatMap(c => c.parcelas || []).filter(p => getMesAno(p.vencimento) === m).reduce((acc, p) => acc + (p.valor || 0), 0));

  // Pizza de status
  const statusApagar = {
    Pendente: contasApagar.flatMap(c => c.parcelas || []).filter(p => p.status === "Pendente").length,
    Pago: contasApagar.flatMap(c => c.parcelas || []).filter(p => p.status === "Pago").length
  };
  const statusAreceber = {
    Pendente: contasAreceber.flatMap(c => c.parcelas || []).filter(p => p.status === "Pendente").length,
    Recebido: contasAreceber.flatMap(c => c.parcelas || []).filter(p => p.status === "Recebido").length
  };

  const hojeISO = getHojeISO();
  const apagarHoje = contasApagar.flatMap(c => (c.parcelas || []).filter(p => p.vencimento === hojeISO && p.status === "Pendente"));
  const areceberHoje = contasAreceber.flatMap(c => (c.parcelas || []).filter(p => p.vencimento === hojeISO && p.status === "Pendente"));
  const totalApagarHoje = apagarHoje.reduce((acc, p) => acc + (p.valor || 0), 0);
  const totalAreceberHoje = areceberHoje.reduce((acc, p) => acc + (p.valor || 0), 0);

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      <h2 className="text-white fw-bold mb-4">Dashboard Financeiro</h2>
      {loading ? (
        <div className="text-center text-white py-5">
          <div className="spinner-border text-light mb-3" role="status"></div>
          <div>Carregando dados...</div>
        </div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="card bg-dark text-white shadow border-0">
                <div className="card-body text-center">
                  <div className="fs-1 fw-bold text-danger">R$ {totalApagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  <div className="fw-semibold mt-2">Total a Pagar</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card bg-dark text-white shadow border-0">
                <div className="card-body text-center">
                  <div className="fs-1 fw-bold text-success">R$ {totalAreceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  <div className="fw-semibold mt-2">Total a Receber</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card bg-dark text-white shadow border-0">
                <div className="card-body text-center">
                  <div className="fs-2 fw-bold text-warning">{statusApagar.Pendente}</div>
                  <div className="fw-semibold mt-2">Contas a Pagar Pendentes</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card bg-dark text-white shadow border-0">
                <div className="card-body text-center">
                  <div className="fs-2 fw-bold text-info">{statusAreceber.Pendente}</div>
                  <div className="fw-semibold mt-2">Contas a Receber Pendentes</div>
                </div>
              </div>
            </div>
          </div>
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-6">
              <div className="card bg-black text-white shadow border-0 border-danger mb-2">
                <div className="card-body text-center">
                  <div className="fs-4 fw-bold text-danger">R$ {totalApagarHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  <div className="fw-semibold">A Pagar Hoje</div>
                  <div className="small text-secondary">{apagarHoje.length} parcela(s) pendente(s)</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-6">
              <div className="card bg-black text-white shadow border-0 border-success mb-2">
                <div className="card-body text-center">
                  <div className="fs-4 fw-bold text-success">R$ {totalAreceberHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  <div className="fw-semibold">A Receber Hoje</div>
                  <div className="small text-secondary">{areceberHoje.length} parcela(s) pendente(s)</div>
                </div>
              </div>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card bg-dark text-white shadow border-0 mb-4">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Comparativo Mensal</h5>
                  <Bar
                    data={{
                      labels: meses,
                      datasets: [
                        {
                          label: "A Pagar",
                          data: apagarPorMes,
                          backgroundColor: "#dc3545"
                        },
                        {
                          label: "A Receber",
                          data: areceberPorMes,
                          backgroundColor: "#198754"
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { labels: { color: "#fff" } },
                        title: { display: false }
                      },
                      scales: {
                        x: { ticks: { color: "#fff" } },
                        y: { ticks: { color: "#fff" } }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card bg-dark text-white shadow border-0 mb-4">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Status Contas a Pagar</h5>
                  <Pie
                    data={{
                      labels: ["Pendente", "Pago"],
                      datasets: [
                        {
                          data: [statusApagar.Pendente, statusApagar.Pago],
                          backgroundColor: ["#ffc107", "#198754"]
                        }
                      ]
                    }}
                    options={{
                      plugins: {
                        legend: { labels: { color: "#fff" } }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="card bg-dark text-white shadow border-0">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Status Contas a Receber</h5>
                  <Doughnut
                    data={{
                      labels: ["Pendente", "Recebido"],
                      datasets: [
                        {
                          data: [statusAreceber.Pendente, statusAreceber.Recebido],
                          backgroundColor: ["#0dcaf0", "#198754"]
                        }
                      ]
                    }}
                    options={{
                      plugins: {
                        legend: { labels: { color: "#fff" } }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PrincipalDashboard; 