const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas de propuestas
const propuestaRoutes = require('./src/routes/propuestaRoutes');
app.use('/api', propuestaRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`API_TRAMITACION corriendo en el puerto ${PORT}`);
});