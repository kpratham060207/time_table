const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const STORAGE_KEY = "weekgrid-timetable";

const form = document.getElementById("class-form");
const weekGrid = document.getElementById("week-grid");
const formError = document.getElementById("form-error");
const formSuccess = document.getElementById("form-success");
const clearAllBtn = document.getElementById("clear-all");
const toast = document.getElementById("toast");

function emptyTimetable() {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

function loadTimetable() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyTimetable();
    const data = JSON.parse(raw);
    const timetable = emptyTimetable();
    for (const day of DAYS) {
      if (Array.isArray(data[day])) {
        timetable[day] = data[day];
      }
    }
    return timetable;
  } catch {
    return emptyTimetable();
  }
}

function saveTimetable(timetable) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timetable));
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time) {
  const [hoursText, minutes] = time.split(":");
  let hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

function showMessage(element, text) {
  formError.hidden = true;
  formSuccess.hidden = true;
  element.textContent = text;
  element.hidden = false;
}

function clearMessages() {
  formError.hidden = true;
  formSuccess.hidden = true;
}

function showToast(text) {
  toast.textContent = text;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.hidden = true;
    }, 250);
  }, 2200);
}

function todayKey() {
  const map = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[new Date().getDay()];
}

function render(timetable) {
  const today = todayKey();
  weekGrid.innerHTML = "";

  for (const day of DAYS) {
    const classes = [...timetable[day]].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    const column = document.createElement("article");
    column.className = "day-column";
    if (day === today) column.classList.add("is-today");

    const header = document.createElement("div");
    header.className = "day-header";
    header.innerHTML = `
      <h3>${DAY_LABELS[day]}</h3>
      <p class="count">${classes.length} class${classes.length === 1 ? "" : "es"}</p>
    `;

    const list = document.createElement("ul");
    list.className = "day-classes";

    if (classes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-day";
      empty.textContent = "No classes";
      list.appendChild(empty);
    } else {
      for (const classInfo of classes) {
        const item = document.createElement("li");
        item.className = "class-card";
        item.innerHTML = `
          <p class="class-code">${escapeHtml(classInfo.courseCode)}</p>
          <p class="class-name">${escapeHtml(classInfo.courseName)}</p>
          <p class="class-time">${formatTime(classInfo.startTime)} – ${formatTime(classInfo.endTime)}</p>
          <button
            type="button"
            class="remove-btn"
            data-day="${day}"
            data-id="${classInfo.id}"
            aria-label="Remove ${escapeHtml(classInfo.courseCode)}"
          >&times;</button>
        `;
        list.appendChild(item);
      }
    }

    column.appendChild(header);
    column.appendChild(list);
    weekGrid.appendChild(column);
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

let timetable = loadTimetable();
render(timetable);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearMessages();

  const day = document.getElementById("day").value;
  const courseCode = document.getElementById("course-code").value.trim();
  const courseName = document.getElementById("course-name").value.trim();
  const startTime = document.getElementById("start-time").value;
  const endTime = document.getElementById("end-time").value;

  if (!courseCode || !courseName || !startTime || !endTime) {
    showMessage(formError, "Please fill in every field.");
    return;
  }

  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    showMessage(formError, "End time must be after start time.");
    return;
  }

  timetable[day].push({
    id: createId(),
    courseCode,
    courseName,
    startTime,
    endTime,
  });

  saveTimetable(timetable);
  render(timetable);
  showMessage(formSuccess, `Added ${courseCode} on ${DAY_LABELS[day]}.`);
  showToast(`Added ${courseCode}`);

  form.reset();
  document.getElementById("day").value = day;
  document.getElementById("course-code").focus();
});

weekGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-btn");
  if (!button) return;

  const day = button.dataset.day;
  const id = button.dataset.id;
  const removed = timetable[day].find((item) => item.id === id);

  timetable[day] = timetable[day].filter((item) => item.id !== id);
  saveTimetable(timetable);
  render(timetable);
  clearMessages();
  showToast(removed ? `Removed ${removed.courseCode}` : "Class removed");
});

clearAllBtn.addEventListener("click", () => {
  const total = DAYS.reduce((sum, day) => sum + timetable[day].length, 0);
  if (total === 0) {
    showToast("Nothing to clear");
    return;
  }

  const confirmed = window.confirm(
    `Remove all ${total} class${total === 1 ? "" : "es"} from your timetable?`
  );
  if (!confirmed) return;

  timetable = emptyTimetable();
  saveTimetable(timetable);
  render(timetable);
  clearMessages();
  showToast("Timetable cleared");
});
