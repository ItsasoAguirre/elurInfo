console.log('Probando servidor simple...');

const express = require('express');
const app = express();
const PORT = 3001;

app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor de prueba ejecutándose en puerto ${PORT}`);
});