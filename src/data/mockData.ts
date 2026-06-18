// Mock data for Sistema 360 Comercial

export const mockUser = {
  name: 'Ceça',
  role: 'Ceça Importados',
  avatar: 'C',
};

export const mockKPIs = {
  vendasSemana: { value: 12850.0, label: 'Vendas da Semana', change: +8.4 },
  vendasMes: { value: 47320.5, label: 'Vendas do Mês', change: +3.2 },
  recebimentosPendentes: { value: 8640.0, label: 'Recebimentos Pendentes', change: -2.1 },
  clientesAtraso: { value: 5, label: 'Clientes em Atraso', change: +1 },
};

export const mockVendas = [
  {
    id: 'V-1024',
    cliente: 'Ana Paula Rocha',
    initials: 'AP',
    color: '#7C5CBF',
    data: '26/05/2026',
    valor: 1250.0,
    status: 'Pago',
    itens: 3,
    pagamento: 'Cartão de Crédito',
  },
  {
    id: 'V-1023',
    cliente: 'João Ferreira',
    initials: 'JF',
    color: '#1DB86E',
    data: '26/05/2026',
    valor: 530.5,
    status: 'Pendente',
    itens: 1,
    pagamento: 'Boleto',
  },
  {
    id: 'V-1022',
    cliente: 'Mariana Costa',
    initials: 'MC',
    color: '#C9A84C',
    data: '25/05/2026',
    valor: 3780.0,
    status: 'Pago',
    itens: 7,
    pagamento: 'PIX',
  },
  {
    id: 'V-1021',
    cliente: 'Carlos Eduardo',
    initials: 'CE',
    color: '#E05252',
    data: '25/05/2026',
    valor: 890.0,
    status: 'Atrasado',
    itens: 2,
    pagamento: 'Parcelado',
  },
  {
    id: 'V-1020',
    cliente: 'Fernanda Lima',
    initials: 'FL',
    color: '#38C985',
    data: '24/05/2026',
    valor: 2100.0,
    status: 'Pago',
    itens: 4,
    pagamento: 'PIX',
  },
  {
    id: 'V-1019',
    cliente: 'Roberto Silva',
    initials: 'RS',
    color: '#7C5CBF',
    data: '23/05/2026',
    valor: 640.0,
    status: 'Pago',
    itens: 2,
    pagamento: 'Cartão de Débito',
  },
  {
    id: 'V-1018',
    cliente: 'Beatriz Alves',
    initials: 'BA',
    color: '#E08C2D',
    data: '23/05/2026',
    valor: 1890.0,
    status: 'Pendente',
    itens: 5,
    pagamento: 'Boleto',
  },
];

export const mockRecebimentos = [
  {
    id: 'R-0312',
    cliente: 'Carlos Eduardo',
    initials: 'CE',
    color: '#E05252',
    vencimento: '28/05/2026',
    parcela: '2/3',
    valor: 890.0,
    diasAtraso: 3,
    status: 'Atrasado',
  },
  {
    id: 'R-0313',
    cliente: 'Lúcia Mendes',
    initials: 'LM',
    color: '#E08C2D',
    vencimento: '30/05/2026',
    parcela: '1/2',
    valor: 420.0,
    diasAtraso: 0,
    status: 'Pendente',
  },
  {
    id: 'R-0314',
    cliente: 'Roberto Silva',
    initials: 'RS',
    color: '#7C5CBF',
    vencimento: '02/06/2026',
    parcela: 'À vista',
    valor: 1560.0,
    diasAtraso: 0,
    status: 'Pendente',
  },
  {
    id: 'R-0315',
    cliente: 'Beatriz Alves',
    initials: 'BA',
    color: '#1DB86E',
    vencimento: '05/06/2026',
    parcela: '1/4',
    valor: 750.0,
    diasAtraso: 0,
    status: 'Pendente',
  },
  {
    id: 'R-0316',
    cliente: 'João Ferreira',
    initials: 'JF',
    color: '#38C985',
    vencimento: '26/05/2026',
    parcela: 'À vista',
    valor: 530.5,
    diasAtraso: 0,
    status: 'Hoje',
  },
];

export const mockEstoqueBaixo = [
  { id: 'P-001', nome: 'Cabo USB-C 2m', estoque: 3, minimo: 10, categoria: 'Eletrônicos' },
  { id: 'P-002', nome: 'Mouse Sem Fio Logitech', estoque: 1, minimo: 5, categoria: 'Periféricos' },
  { id: 'P-003', nome: 'Caderno A4 Espiral', estoque: 8, minimo: 20, categoria: 'Papelaria' },
  { id: 'P-004', nome: 'Caneta Esferográfica Preta', estoque: 12, minimo: 50, categoria: 'Papelaria' },
];

export const mockMaisVendidos = [
  { id: 'P-010', nome: 'Fone de Ouvido Bluetooth', vendas: 84, receita: 16800.0, cor: '#1DB86E' },
  { id: 'P-011', nome: 'Capa de Celular Premium', vendas: 72, receita: 5040.0, cor: '#7C5CBF' },
  { id: 'P-012', nome: 'Cabo HDMI 1.5m', vendas: 65, receita: 4550.0, cor: '#C9A84C' },
  { id: 'P-013', nome: 'Carregador Rápido 65W', vendas: 53, receita: 10600.0, cor: '#E08C2D' },
];

export const mockProdutos = [
  { cod: 1001, nome: 'Fone de Ouvido Bluetooth', categoria: 'Eletrônicos', estoque: 42, minimo: 10, preco: 199.9, status: 'Ativo' },
  { cod: 1002, nome: 'Capa de Celular Premium', categoria: 'Acessórios', estoque: 88, minimo: 15, preco: 69.9, status: 'Ativo' },
  { cod: 1003, nome: 'Cabo HDMI 1.5m', categoria: 'Eletrônicos', estoque: 34, minimo: 8, preco: 69.9, status: 'Ativo' },
  { cod: 1004, nome: 'Carregador Rápido 65W', categoria: 'Eletrônicos', estoque: 21, minimo: 5, preco: 199.9, status: 'Ativo' },
  { cod: 1005, nome: 'Cabo USB-C 2m', categoria: 'Eletrônicos', estoque: 3, minimo: 10, preco: 39.9, status: 'Estoque Baixo' },
  { cod: 1006, nome: 'Mouse Sem Fio Logitech', categoria: 'Periféricos', estoque: 1, minimo: 5, preco: 189.9, status: 'Estoque Baixo' },
  { cod: 1007, nome: 'Caderno A4 Espiral', categoria: 'Papelaria', estoque: 8, minimo: 20, preco: 24.9, status: 'Estoque Baixo' },
  { cod: 1008, nome: 'Caneta Esferográfica Preta', categoria: 'Papelaria', estoque: 12, minimo: 50, preco: 2.5, status: 'Estoque Baixo' },
  { cod: 1009, nome: 'Suporte para Notebook', categoria: 'Acessórios', estoque: 15, minimo: 5, preco: 129.9, status: 'Ativo' },
  { cod: 1010, nome: 'Webcam HD 1080p', categoria: 'Periféricos', estoque: 9, minimo: 3, preco: 249.9, status: 'Ativo' },
];

export const mockClientes = [
  { id: 'C-001', nome: 'Ana Paula Rocha', initials: 'AP', color: '#7C5CBF', telefone: '(11) 99823-4512', ultimaCompra: '26/05/2026', valorAberto: 0, status: 'Ativo', totalCompras: 4 },
  { id: 'C-002', nome: 'João Ferreira', initials: 'JF', color: '#1DB86E', telefone: '(21) 97654-3210', ultimaCompra: '26/05/2026', valorAberto: 530.5, status: 'Pendente', totalCompras: 2 },
  { id: 'C-003', nome: 'Mariana Costa', initials: 'MC', color: '#C9A84C', telefone: '(11) 98765-1234', ultimaCompra: '25/05/2026', valorAberto: 0, status: 'Ativo', totalCompras: 8 },
  { id: 'C-004', nome: 'Carlos Eduardo', initials: 'CE', color: '#E05252', telefone: '(31) 96543-2109', ultimaCompra: '25/05/2026', valorAberto: 890.0, status: 'Em atraso', totalCompras: 3 },
  { id: 'C-005', nome: 'Fernanda Lima', initials: 'FL', color: '#38C985', telefone: '(41) 95432-1098', ultimaCompra: '24/05/2026', valorAberto: 0, status: 'Ativo', totalCompras: 6 },
  { id: 'C-006', nome: 'Roberto Silva', initials: 'RS', color: '#7C5CBF', telefone: '(51) 94321-0987', ultimaCompra: '23/05/2026', valorAberto: 1560.0, status: 'Pendente', totalCompras: 2 },
  { id: 'C-007', nome: 'Beatriz Alves', initials: 'BA', color: '#E08C2D', telefone: '(61) 93210-9876', ultimaCompra: '23/05/2026', valorAberto: 750.0, status: 'Pendente', totalCompras: 3 },
  { id: 'C-008', nome: 'Lúcia Mendes', initials: 'LM', color: '#1DB86E', telefone: '(71) 92109-8765', ultimaCompra: '20/05/2026', valorAberto: 420.0, status: 'Pendente', totalCompras: 1 },
];

export const mockResumoFinanceiro = {
  totalEntradas: 47320.5,
  totalSaidas: 21480.0,
  saldo: 25840.5,
  previsaoMes: 52000.0,
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
