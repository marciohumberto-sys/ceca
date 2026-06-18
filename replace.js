const fs = require('fs');
const files = [
  'src/pages/Recebimentos.tsx',
  'src/pages/Vendas.tsx',
  'src/pages/Produtos.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Clientes.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, '`${import.meta.env.VITE_API_URL ?? \\'http://localhost:3001\\'}$1`');
  content = content.replace(/`http:\/\/localhost:3001([^`]*)`/g, '`${import.meta.env.VITE_API_URL ?? \\'http://localhost:3001\\'}$1`');
  
  fs.writeFileSync(f, content, 'utf8');
  console.log('Updated ' + f);
});
