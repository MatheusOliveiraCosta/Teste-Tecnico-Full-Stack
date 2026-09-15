require('dotenv').config();
const express = require('express');
const cors = require('cors');
const appointmentsRoutes = require('./routes/appointments');

const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req, res) =>{
    res.json({ status: 'ok', mensagem: 'API rodando :)'});
})

app.use('/', appointmentsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>{
    console.log(`Server rodando em http://localhost:${PORT}`);
});