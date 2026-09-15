const cache = new Map();

async function getHolidays(year) {
    if (cache.has(year)) {
        return cache.get(year);
    }

    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/BR`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Falha ao buscar feriados: ${response.status}`);
    }

    const data = await response.json();
    const holidayDates = new Set(data.map((h) => h.date));

    cache.set(year, holidayDates);
    return holidayDates;
}

async function isHoliday(dateStr) {
    const year = dateStr.slice(0, 4);
    const holidays = await getHolidays(year);
    return holidays.has(dateStr);
}

function isWeekend(dateStr) {
    const date = new Date(`${dateStr}T12:00:00Z`);
    const day = date.getUTCDay(); // 0 = domingo, 6 = sábado
    return day === 0 || day === 6;
}

module.exports = {
    isHoliday,
    isWeekend
};