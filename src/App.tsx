import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PageWrapper from './components/PageWrapper';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Recebimentos from './pages/Recebimentos';
import Produtos from './pages/Produtos';
import Clientes from './pages/Clientes';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
      <Route path="/vendas" element={<PageWrapper><Vendas /></PageWrapper>} />
      <Route path="/recebimentos" element={<PageWrapper><Recebimentos /></PageWrapper>} />
      <Route path="/produtos" element={<PageWrapper><Produtos /></PageWrapper>} />
      <Route path="/clientes" element={<PageWrapper><Clientes /></PageWrapper>} />
      <Route path="/relatorios" element={<PageWrapper><Relatorios /></PageWrapper>} />
      <Route path="/configuracoes" element={<PageWrapper><Configuracoes /></PageWrapper>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
