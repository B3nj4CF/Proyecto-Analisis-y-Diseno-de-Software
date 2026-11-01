const express = require('express');
const cors = require('cors');
const routes = require('./src/routes/index');

const app = express();

app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    console.log(`[RESPONSE] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });

  next();
});

app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((error, req, res, next) => {
  console.error('[ERROR] Error no controlado:', error);
  if (res.headersSent) {
    return next(error);
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});