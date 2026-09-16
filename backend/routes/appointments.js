const express = require('express');
const router = express.Router();
const pool = require('../bd');
const { isHoliday, isWeekend } = require('../utils/holidays');

const HORA_INICIO = 8;
const HORA_FIM = 18;

function gerarSlots() {
    const slots = [];
    for (let h = HORA_INICIO; h < HORA_FIM; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
}

function dataValida(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(`${dateStr}T00:00:00Z`));
}

function dataPassada(dateStr){
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataInformada = new Date(`${dateStr}T00:00:00`);
    return dataInformada < hoje;
}

function horarioPassado(dateStr, time) {
    const dataHora = new Date(`${dateStr}T${time}:00`);
    return dataHora < new Date();
}

//get avaliable
router.get('/available', async (req, res) => {
    const { date } = req.query;

    if (!date || !dataValida(date)) {
        return res.status(400).json({ erro: 'Informe uma data válida no formato YYYY-MM-DD' });
    }

    if (dataPassada(date)) {
        return res.status(400).json({ erro: 'Não é possível consultar disponibilidade para uma data passada'});
    }

    try {
        if (isWeekend(date)) {
            return res.json({ date, disponiveis: [], motivo: 'fim de semana' });
        }

        if (await isHoliday(date)) {
            return res.json({ date, disponiveis: [], motivo: 'feriado' });
        }

        // Busca horários já ocupados nessa data
        const [ocupados] = await pool.query(
        'SELECT TIME_FORMAT(tempo, "%H:%i") AS tempo FROM appointments WHERE data_ = ?',
        [date]
        );
        const horariosOcupados = new Set(ocupados.map((o) => o.tempo));

        const disponiveis = gerarSlots().filter(
            (slot) => !horariosOcupados.has(slot) && !horarioPassado(date, slot)
        );

        return res.json({ date, disponiveis });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao consultar disponibilidade' });
    }
});

//post appointments
router.post('/appointments', async (req, res) => {
    const { date, time, paciente } = req.body;

    if (!date || !dataValida(date)) {
        return res.status(400).json({ erro: 'Informe uma data válida no formato YYYY-MM-DD' });
    }
    if (dataPassada(date)){
        return res.status(400).json({ erro: 'Não é possível agendar em uma data passada'})
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({ erro: 'Informe um horário válido no formato HH:MM' });
    }
    if (horarioPassado(date, time)) {
        return res.status(400).json({ erro: 'Não é possível agendar um horário que já passou' });
    }
    if (!paciente || paciente.trim().length === 0) {
        return res.status(400).json({ erro: 'Informe o nome do paciente' });
    }

    const slotsValidos = gerarSlots();
    if (!slotsValidos.includes(time)) {
        return res.status(400).json({ erro: 'Horário fora do funcionamento (08:00 às 18:00)' });
    }

    try {
        if (isWeekend(date)) {
            return res.status(400).json({ erro: 'Não é possível agendar em finais de semana' });
        }
        if (await isHoliday(date)) {
            return res.status(400).json({ erro: 'Não é possível agendar em feriados' });
        }

        const [ocupados] = await pool.query(
            'SELECT id FROM appointments WHERE data_ = ? AND tempo = ?',
            [date, time]
        );
        if (ocupados.length > 0) {
            return res.status(409).json({ erro: 'Esse horário já está ocupado' });
        }

        const [resultado] = await pool.query(
            'INSERT INTO appointments (data_, tempo, paciente) VALUES (?, ?, ?)',
            [date, time, paciente.trim()]
        );

        return res.status(201).json({
            id: resultado.insertId,
            date,
            time,
            paciente: paciente.trim(),
            mensagem: 'Agendamento confirmado com sucesso',
        });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Esse horário já está ocupado' });
        }
        return res.status(500).json({ erro: 'Erro ao criar agendamento' });
    }
});

//get appointments
router.get('/appointments', async (req, res) => {
  try {
    const [rows] = await pool.query(
        `SELECT id, DATE_FORMAT(data_, "%Y-%m-%d") AS date,
                TIME_FORMAT(tempo, "%H:%i") AS time,
                paciente, criado_em
        FROM appointments
        ORDER BY data_, tempo`
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar agendamentos' });
  }
});

module.exports = router;
