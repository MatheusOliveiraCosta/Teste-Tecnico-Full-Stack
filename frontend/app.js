const API_URL = 'http://localhost:3000';

const inputData = document.getElementById('data');
const divMensagem = document.getElementById('mensagem');
const divHorarios = document.getElementById('horarios');
const formAgendamento = document.getElementById('form-agendamento');
const resumoAgendamento = document.getElementById('resumo');
const inputPaciente = document.getElementById('paciente');
const btnConfirmar = document.getElementById('btn-confirmar');
const divResultado = document.getElementById('resul');
const listaAgendamentos = document.getElementById('lista-agendados');

let dataEscolhida = null;
let horarioEscolhido = null;
inputData.min = new Date().toISOString().split('T')[0];

inputData.addEventListener('change', async () => {
    dataEscolhida = inputData.value;
    formAgendamento.hidden = true;
    divHorarios.innerHTML = '';
    divMensagem.textContent = '';
    divMensagem.className = 'mensagem';

    if (!dataEscolhida) return;

    try {
        const resp = await fetch(`${API_URL}/available?date=${dataEscolhida}`);
        const data = await resp.json();

        if (!resp.ok) {
            divMensagem.textContent = data.erro || 'Erro ao buscar horários';
            divMensagem.className = 'mensagem erro';
            return;
        }

        if (data.disponiveis.length === 0) {
            const motivo = data.motivo === 'feriado' ? 'é feriado' : data.motivo === 'fim de semana' ? 'é final de semana' : 'não tem horários livres';
            divMensagem.textContent = `Sem horários disponíveis: esse dia ${motivo}.`;
            divMensagem.className = 'mensagem erro';
            return;
        }

        data.disponiveis.forEach((horario) => {
            const btn = document.createElement('button');
            btn.className = 'slot';
            btn.textContent = horario;
            btn.type = 'button';
            btn.addEventListener('click', () => selecionarHorario(horario));
            divHorarios.appendChild(btn);
        });
    } catch (err) {
        divMensagem.textContent = 'Não foi possível conectar ao servidor.';
        divMensagem.className = 'mensagem erro';
    }
});

function selecionarHorario(horario) {
    horarioEscolhido = horario;
    resumoAgendamento.textContent = `Data: ${dataEscolhida} às ${horario}`;
    formAgendamento.hidden = false;
    divResultado.textContent = '';
}

btnConfirmar.addEventListener('click', async () => {
  const paciente = inputPaciente.value.trim();

  if (!paciente) {
        divResultado.textContent = 'Informe seu nome.';
        divResultado.className = 'mensagem erro';
        return;
  }

  try {
    const resp = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dataEscolhida, time: horarioEscolhido, paciente }),
    });
    const data = await resp.json();

    if (!resp.ok) {
        divResultado.textContent = data.erro || 'Erro ao criar agendamento';
        divResultado.className = 'mensagem erro';
        return;
    }

    divResultado.textContent = `Agendamento confirmado para ${data.date} às ${data.time}!`;
    divResultado.className = 'mensagem sucesso';
    inputPaciente.value = '';
    carregarAgendamentos();
    inputData.dispatchEvent(new Event('change')); 
  } catch (err) {
    divResultado.textContent = 'Não foi possível conectar ao servidor.';
    divResultado.className = 'mensagem erro';
  }
});

async function carregarAgendamentos() {
    try {
        const resp = await fetch(`${API_URL}/appointments`);
        const dados = await resp.json();

        listaAgendamentos.innerHTML = '';
        dados.forEach((ag) => {
            const li = document.createElement('li');
            li.textContent = `${ag.date} às ${ag.time} - ${ag.paciente}`;
            listaAgendamentos.appendChild(li);
        });
    } catch (err) {
        console.error('Erro ao carregar agendamentos', err);
    }
}

carregarAgendamentos();