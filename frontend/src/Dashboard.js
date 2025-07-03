import React from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import CadastroParceiro from "./telas/CadastroParceiro";
import ConsultaParceiro from "./telas/ConsultaParceiro";
import FinanceiroApagarCadastrar from "./telas/FinanceiroApagarCadastrar";
import FinanceiroApagarConsultar from "./telas/FinanceiroApagarConsultar";
import { FaUserPlus, FaUsers, FaMoneyBillWave, FaSignOutAlt, FaUserFriends, FaChevronRight, FaChevronLeft, FaFileInvoiceDollar, FaSearchDollar } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

function Dashboard() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const active = location.pathname.includes("consulta-parceiro")
    ? "consulta-parceiro"
    : location.pathname.includes("cadastro-parceiro")
    ? "cadastro-parceiro"
    : location.pathname.includes("financeiro-apagar-cadastrar")
    ? "financeiro-apagar-cadastrar"
    : location.pathname.includes("financeiro-apagar-consultar")
    ? "financeiro-apagar-consultar"
    : "";

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", background: "#000" }}>
      {/* Sidebar moderna */}
      <nav
        className={`d-flex flex-column flex-shrink-0 p-3 text-white bg-dark shadow-lg position-relative animate__animated animate__fadeInLeft ${sidebarOpen ? "" : "collapsed"}`}
        style={{ width: sidebarOpen ? 260 : 70, transition: "width 0.3s" }}
      >
        <div className="d-flex align-items-center justify-content-between mb-4">
          <span className="fs-4 fw-bold d-flex align-items-center gap-2">
            <FaUserFriends size={28} />
            {sidebarOpen && "Braza Forte"}
          </span>
          <button
            className="btn btn-sm btn-outline-light border-0 ms-2"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Recolher" : "Expandir"}
            style={{ zIndex: 2 }}
          >
            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto gap-2">
          <li>
            <span className="nav-link text-white fw-bold small mb-1" style={{ opacity: 0.7 }}>
              <FaUsers className="me-2" />{sidebarOpen && "Parceiros"}
            </span>
            <ul className="nav flex-column ms-1 gap-1">
              <li>
                <Link
                  to="/dashboard/cadastro-parceiro"
                  className={`nav-link d-flex align-items-center gap-2 ${active === "cadastro-parceiro" ? "active bg-light text-dark shadow-sm" : "text-white"}`}
                  style={{ borderRadius: 8, transition: "all 0.2s" }}
                >
                  <FaUserPlus />{sidebarOpen && "Cadastrar"}
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/consulta-parceiro"
                  className={`nav-link d-flex align-items-center gap-2 ${active === "consulta-parceiro" ? "active bg-light text-dark shadow-sm" : "text-white"}`}
                  style={{ borderRadius: 8, transition: "all 0.2s" }}
                >
                  <FaUsers />{sidebarOpen && "Consultar"}
                </Link>
              </li>
            </ul>
          </li>
          <li className="mt-3">
            <span className="nav-link text-white fw-bold small mb-1" style={{ opacity: 0.7 }}>
              <FaMoneyBillWave className="me-2" />{sidebarOpen && "Financeiro Apagar"}
            </span>
            <ul className="nav flex-column ms-1 gap-1">
              <li>
                <Link
                  to="/dashboard/financeiro-apagar-cadastrar"
                  className={`nav-link d-flex align-items-center gap-2 ${active === "financeiro-apagar-cadastrar" ? "active bg-light text-dark shadow-sm" : "text-white"}`}
                  style={{ borderRadius: 8, transition: "all 0.2s" }}
                >
                  <FaFileInvoiceDollar />{sidebarOpen && "Cadastrar"}
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/financeiro-apagar-consultar"
                  className={`nav-link d-flex align-items-center gap-2 ${active === "financeiro-apagar-consultar" ? "active bg-light text-dark shadow-sm" : "text-white"}`}
                  style={{ borderRadius: 8, transition: "all 0.2s" }}
                >
                  <FaSearchDollar />{sidebarOpen && "Consultar"}
                </Link>
              </li>
            </ul>
          </li>
          <li className="mt-3">
            <span className="nav-link text-white fw-bold small mb-1" style={{ opacity: 0.7 }}>
              <FaMoneyBillWave className="me-2" />{sidebarOpen && "Financeiro A Receber"}
            </span>
            <ul className="nav flex-column ms-1 gap-1">
              <li>
                <a href="#" className="nav-link d-flex align-items-center gap-2 text-white" style={{ borderRadius: 8 }}><FaUserPlus />{sidebarOpen && "Cadastrar"}</a>
              </li>
              <li>
                <a href="#" className="nav-link d-flex align-items-center gap-2 text-white" style={{ borderRadius: 8 }}><FaUsers />{sidebarOpen && "Consultar"}</a>
              </li>
            </ul>
          </li>
        </ul>
        <hr className="mt-auto" />
        <div className="d-flex flex-column align-items-center gap-2">
          {sidebarOpen && <small className="text-secondary mb-1">{user?.email}</small>}
          <button className="btn btn-outline-light btn-sm w-100 d-flex align-items-center gap-2" onClick={handleLogout}>
            <FaSignOutAlt />{sidebarOpen && "Sair"}
          </button>
        </div>
      </nav>
      {/* Conteúdo principal moderno */}
      <div className="flex-grow-1 p-0" style={{ background: "#111", minHeight: "100vh" }}>
        {/* Topbar */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-secondary bg-black shadow-sm" style={{ minHeight: 64 }}>
          <h4 className="mb-0 text-white fw-bold text-uppercase letter-spacing-1 animate__animated animate__fadeInDown">
            {active === "cadastro-parceiro" && "Cadastro de Parceiro"}
            {active === "consulta-parceiro" && "Consulta de Parceiros"}
            {active === "financeiro-apagar-cadastrar" && "Cadastro de Conta a Pagar"}
            {active === "financeiro-apagar-consultar" && "Consulta de Contas a Pagar"}
            {!active && "Dashboard"}
          </h4>
        </div>
        <div className="p-4 animate__animated animate__fadeIn">
          <Routes>
            <Route path="/cadastro-parceiro" element={<CadastroParceiro />} />
            <Route path="/consulta-parceiro" element={<ConsultaParceiro />} />
            <Route path="/financeiro-apagar-cadastrar" element={<FinanceiroApagarCadastrar />} />
            <Route path="/financeiro-apagar-consultar" element={<FinanceiroApagarConsultar />} />
            {/* Outras rotas do dashboard podem ser adicionadas aqui */}
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 