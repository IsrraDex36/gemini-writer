require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3000; 

// Configuración básica
app.use(cors()); // Permite peticiones desde tu frontend Vue
app.use(express.json()); // Para procesar JSON en las requests

// Conexión con Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

// Ruta que usará tu frontend
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ text: response.text() }); // Envía la respuesta a Vue
  } catch (error) {
    console.error("Error con Gemini:", error);
    res.status(500).json({ error: "Error al generar la respuesta" });
  }
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Node.js corriendo en http://localhost:${PORT}`);
});