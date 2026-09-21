import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ClubeAtivoProvider } from "./lib/clubeContext";
import { DashboardPage } from "./pages/DashboardPage";
import { FinanceiroPage } from "./pages/FinanceiroPage";

export function App() {
  return (
    <ClubeAtivoProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/flamengo" replace />} />
          <Route path="/dashboard/:clube" element={<DashboardPage />} />
          <Route path="/financeiro/:clube" element={<FinanceiroPage />} />
          <Route path="*" element={<Navigate to="/dashboard/flamengo" replace />} />
        </Routes>
      </Layout>
    </ClubeAtivoProvider>
  );
}
