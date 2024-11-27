window.alert("script do calendário está em funcinamento")
const calendarElement = document.getElementById("calendar");
const selectedDateElement = document.getElementById("selected-date");

// Função para formatar dia da semana
const getDayOfWeek = (date) => {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return days[date.getDay()];
};

// Função para criar o calendário
const createCalendar = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayElement = document.createElement("div");

    dayElement.classList.add("day");
    dayElement.textContent = day;

    // Desabilitar dias anteriores ao atual
    if (date < today) {
      dayElement.classList.add("disabled");
    } else {
      dayElement.addEventListener("click", () => selectDate(date, dayElement));
    }

    calendarElement.appendChild(dayElement);
  }
};

// Função para selecionar a data
const selectDate = (date, dayElement) => {
  const previouslySelected = document.querySelector(".day.selected");
  if (previouslySelected) {
    previouslySelected.classList.remove("selected");
  }

  dayElement.classList.add("selected");

  const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
  const dayOfWeek = getDayOfWeek(date);

  selectedDateElement.textContent = `Data selecionada: ${formattedDate}, ${dayOfWeek}`;
};

// Inicializar calendário
createCalendar();