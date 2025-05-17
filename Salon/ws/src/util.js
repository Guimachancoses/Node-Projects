const moment = require("moment");

module.exports = {
  SLOT_DURATION: 30,
  isOpened: (horarios) => {
    // Verificando se existe registro naquele dia da semana
    const horariosDia = horarios.filter((h) => h.dias.includes(moment().day()));
    if (horariosDia.length > 0) {
      // Verificando horários
      for (let h of horariosDia) {
        const inicio = moment(moment(h.inicio).format("HH:mm"), "HH:mm:ss");
        const fim = moment(moment(h.fim).format("HH:mm"), "HH:mm:ss");
        if (moment().isBetween(inicio, fim)) {
          return true;
        }
      }
      return false;
    }
    return false;
  },
  hourToMinutes: (hourMinute) => {
    const [hour, minutes] = hourMinute.split(":");
    return parseInt(parseInt(hour) * 60 + parseInt(minutes));
  },
  sliceMinutes: (start, end, duration) => {
    const slices = [];
    let count = 0;

    start = moment(start);
    end = moment(end);

    while (end > start) {
      slices.push(start.format("HH:mm"));

      start = start.add(duration, "minutes");
      count++;
    }

    return slices;
  },
  mergeDateTime: (date, time) => {
    const merged = `${moment(date).format("YYYY-MM-DD")}T${moment(time).format(
      "HH:mm"
    )}`;
    return merged;
  },
  sliptByValue: (array, value) => {
    let newArray = [[]];
    array.forEach((item) => {
      if (item != value) {
        newArray[newArray.length - 1].push(item);
      } else {
        newArray.push([]);
      }
    });
    return newArray;
  },
};
