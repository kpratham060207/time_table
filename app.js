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

const DAY_SHORT = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const STORAGE_KEY = "weekgrid-timetable";
const DAY_START = 8 * 60; // 8:00 AM
const DAY_END = 20 * 60; // 8:00 PM
const TOTAL_MINUTES = DAY_END - DAY_START;
const HOUR_HEIGHT = 56;

const COURSE_COLORS = [
  { bg: "#ffd6a5", border: "#e89a3c", text: "#7a3f00" },
  { bg: "#bde0fe", border: "#4ea8de", text: "#0b3d5c" },
  { bg: "#c8f0d4", border: "#3fad6d", text: "#0f5132" },
  { bg: "#f5c6e0", border: "#d16ba5", text: "#6b2048" },
  { bg: "#d8d4ff", border: "#8b7cf0", text: "#392f7a" },
  { bg: "#ffe5a0", border: "#e0b000", text: "#6b5200" },
  { bg: "#c5f0ef", border: "#2a9d8f", text: "#0f4c46" },
  { bg: "#ffc9b9", border: "#e76f51", text: "#7a2e1c" },
  { bg: "#d4e7ff", border: "#6096ba", text: "#1d3557" },
  { bg: "#e2f0cb", border: "#83a838", text: "#3d4f12" },
];

const form = document.getElementById("class-form");
const scheduleRows = document.getElementById("schedule-rows");
const addDayRowBtn = document.getElementById("add-day-row");
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

function formatHourLabel(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display} ${suffix}`;
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

function hashCourseCode(code) {
  const normalized = code.trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function colorForCourse(code) {
  return COURSE_COLORS[hashCourseCode(code) % COURSE_COLORS.length];
}

function dayOptionsHtml(selectedDay) {
  return DAYS.map((day) => {
    const selected = day === selectedDay ? " selected" : "";
    return `<option value="${day}"${selected}>${DAY_LABELS[day]}</option>`;
  }).join("");
}

function updateRemoveButtons() {
  const rows = scheduleRows.querySelectorAll(".schedule-row");
  rows.forEach((row) => {
    const button = row.querySelector(".remove-day-row");
    button.disabled = rows.length === 1;
  });
}

function addScheduleRow(selectedDay = "monday") {
  const row = document.createElement("div");
  row.className = "schedule-row";
  row.innerHTML = `
    <label>
      <span>Day</span>
      <select name="day" required>
        ${dayOptionsHtml(selectedDay)}
      </select>
    </label>
    <label>
      <span>Start</span>
      <input type="time" name="startTime" min="08:00" max="20:00" value="09:00" required />
    </label>
    <label>
      <span>End</span>
      <input type="time" name="endTime" min="08:00" max="20:00" value="10:00" required />
    </label>
    <button
      type="button"
      class="btn btn-icon remove-day-row"
      aria-label="Remove this day"
    >&times;</button>
  `;
  scheduleRows.appendChild(row);
  updateRemoveButtons();
  return row;
}

function resetScheduleRows() {
  scheduleRows.innerHTML = "";
  addScheduleRow("monday");
}

function collectSchedules() {
  const rows = [...scheduleRows.querySelectorAll(".schedule-row")];
  return rows.map((row, index) => ({
    index: index + 1,
    day: row.querySelector('[name="day"]').value,
    startTime: row.querySelector('[name="startTime"]').value,
    endTime: row.querySelector('[name="endTime"]').value,
  }));
}

function layoutOverlaps(classes) {
  const sorted = [...classes].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  const active = [];
  let maxCols = 1;

  for (const item of sorted) {
    const start = timeToMinutes(item.startTime);
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].end <= start) active.splice(i, 1);
    }

    const used = new Set(active.map((entry) => entry.col));
    let col = 0;
    while (used.has(col)) col += 1;

    item.col = col;
    active.push({ end: timeToMinutes(item.endTime), col });
    maxCols = Math.max(maxCols, col + 1);
  }

  for (const item of sorted) {
    item.colCount = maxCols;
  }

  return sorted;
}

function visibleRange(startTime, endTime) {
  const start = Math.max(timeToMinutes(startTime), DAY_START);
  const end = Math.min(timeToMinutes(endTime), DAY_END);
  if (end <= start) return null;
  return { start, end };
}

function render(timetable) {
  const today = todayKey();
  const gridHeight = (TOTAL_MINUTES / 60) * HOUR_HEIGHT;

  weekGrid.innerHTML = "";
  weekGrid.style.setProperty("--hour-height", `${HOUR_HEIGHT}px`);

  const inner = document.createElement("div");
  inner.className = "timetable-inner";

  const header = document.createElement("div");
  header.className = "timetable-header";
  header.innerHTML = `<div class="timetable-corner" aria-hidden="true"></div>`;

  for (const day of DAYS) {
    const count = timetable[day].length;
    const label = document.createElement("div");
    label.className = "day-label";
    if (day === today) label.classList.add("is-today");
    label.innerHTML = `
      <p class="day-name">${DAY_SHORT[day]}</p>
      <p class="day-count">${count} class${count === 1 ? "" : "es"}</p>
    `;
    header.appendChild(label);
  }

  const body = document.createElement("div");
  body.className = "timetable-body";
  body.style.height = `${gridHeight}px`;

  const timeAxis = document.createElement("div");
  timeAxis.className = "time-axis";
  timeAxis.style.height = `${gridHeight}px`;

  for (let hour = 8; hour <= 20; hour += 1) {
    const label = document.createElement("div");
    label.className = "time-label";
    label.textContent = formatHourLabel(hour);
    label.style.top = `${((hour * 60 - DAY_START) / TOTAL_MINUTES) * 100}%`;
    timeAxis.appendChild(label);
  }

  body.appendChild(timeAxis);

  for (const day of DAYS) {
    const lane = document.createElement("div");
    lane.className = "day-lane";
    if (day === today) lane.classList.add("is-today");
    lane.style.height = `${gridHeight}px`;

    const classes = layoutOverlaps(
      timetable[day].filter((item) => visibleRange(item.startTime, item.endTime))
    );

    for (const classInfo of classes) {
      const range = visibleRange(classInfo.startTime, classInfo.endTime);
      if (!range) continue;

      const top = ((range.start - DAY_START) / TOTAL_MINUTES) * 100;
      const height = ((range.end - range.start) / TOTAL_MINUTES) * 100;
      const gap = 2;
      const width = `calc((100% - ${(classInfo.colCount + 1) * gap}px) / ${classInfo.colCount})`;
      const left = `calc(${gap}px + ${classInfo.col} * ((100% - ${(classInfo.colCount + 1) * gap}px) / ${classInfo.colCount} + ${gap}px))`;
      const color = colorForCourse(classInfo.courseCode);
      const durationMinutes = range.end - range.start;

      const block = document.createElement("div");
      block.className = "course-block";
      if (durationMinutes < 45) block.classList.add("compact");
      block.dataset.day = day;
      block.dataset.id = classInfo.id;
      block.style.top = `${top}%`;
      block.style.height = `calc(${height}% - 2px)`;
      block.style.left = left;
      block.style.width = width;
      block.style.background = color.bg;
      block.style.borderColor = color.border;
      block.style.color = color.text;
      block.title = `${classInfo.courseCode} — ${classInfo.courseName}\n${formatTime(classInfo.startTime)} – ${formatTime(classInfo.endTime)}\nClick to edit`;
      block.innerHTML = `
        <p class="class-code">${escapeHtml(classInfo.courseCode)}</p>
        <p class="class-name">${escapeHtml(classInfo.courseName)}</p>
        <p class="class-time">${formatTime(classInfo.startTime)} – ${formatTime(classInfo.endTime)}</p>
        <div class="block-actions">
          <button
            type="button"
            class="edit-btn"
            data-day="${day}"
            data-id="${classInfo.id}"
            aria-label="Edit ${escapeHtml(classInfo.courseCode)}"
            title="Edit"
          >✎</button>
          <button
            type="button"
            class="remove-btn"
            data-day="${day}"
            data-id="${classInfo.id}"
            aria-label="Remove ${escapeHtml(classInfo.courseCode)}"
            title="Remove"
          >&times;</button>
        </div>
      `;
      lane.appendChild(block);
    }

    body.appendChild(lane);
  }

  inner.appendChild(header);
  inner.appendChild(body);
  weekGrid.appendChild(inner);
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

function findClass(day, id) {
  return timetable[day]?.find((item) => item.id === id) || null;
}

function openEditModal(day, id) {
  const classInfo = findClass(day, id);
  if (!classInfo) return;

  editId.value = id;
  editOriginalDay.value = day;
  editCourseCode.value = classInfo.courseCode;
  editCourseName.value = classInfo.courseName;
  editDay.value = day;
  editStartTime.value = classInfo.startTime;
  editEndTime.value = classInfo.endTime;
  editSyncCode.checked = false;
  editError.hidden = true;
  editError.textContent = "";

  editModal.hidden = false;
  document.body.style.overflow = "hidden";
  editCourseCode.focus();
}

function closeEditModal() {
  editModal.hidden = true;
  document.body.style.overflow = "";
}

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editId = document.getElementById("edit-id");
const editOriginalDay = document.getElementById("edit-original-day");
const editCourseCode = document.getElementById("edit-course-code");
const editCourseName = document.getElementById("edit-course-name");
const editDay = document.getElementById("edit-day");
const editStartTime = document.getElementById("edit-start-time");
const editEndTime = document.getElementById("edit-end-time");
const editSyncCode = document.getElementById("edit-sync-code");
const editError = document.getElementById("edit-error");

let timetable = loadTimetable();
resetScheduleRows();
render(timetable);

addDayRowBtn.addEventListener("click", () => {
  const usedDays = new Set(collectSchedules().map((item) => item.day));
  const nextDay = DAYS.find((day) => !usedDays.has(day)) || "monday";
  const row = addScheduleRow(nextDay);
  row.querySelector('[name="startTime"]').focus();
});

scheduleRows.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-day-row");
  if (!button || button.disabled) return;
  button.closest(".schedule-row").remove();
  updateRemoveButtons();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearMessages();

  const courseCode = document.getElementById("course-code").value.trim();
  const courseName = document.getElementById("course-name").value.trim();
  const schedules = collectSchedules();

  if (!courseCode || !courseName) {
    showMessage(formError, "Please enter the course code and course name.");
    return;
  }

  for (const schedule of schedules) {
    if (!schedule.startTime || !schedule.endTime) {
      showMessage(formError, `Please fill in the times for day row ${schedule.index}.`);
      return;
    }

    if (timeToMinutes(schedule.endTime) <= timeToMinutes(schedule.startTime)) {
      showMessage(
        formError,
        `End time must be after start time on ${DAY_LABELS[schedule.day]}.`
      );
      return;
    }

    if (
      timeToMinutes(schedule.startTime) < DAY_START ||
      timeToMinutes(schedule.endTime) > DAY_END
    ) {
      showMessage(
        formError,
        `Classes must fall between 8:00 AM and 8:00 PM on ${DAY_LABELS[schedule.day]}.`
      );
      return;
    }
  }

  const dayCounts = {};
  for (const schedule of schedules) {
    dayCounts[schedule.day] = (dayCounts[schedule.day] || 0) + 1;
    if (dayCounts[schedule.day] > 1) {
      showMessage(
        formError,
        `${DAY_LABELS[schedule.day]} is listed more than once. Use different days, or add the course again later.`
      );
      return;
    }
  }

  for (const schedule of schedules) {
    timetable[schedule.day].push({
      id: createId(),
      courseCode,
      courseName,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
  }

  saveTimetable(timetable);
  render(timetable);

  const dayNames = schedules.map((item) => DAY_LABELS[item.day]).join(", ");
  showMessage(
    formSuccess,
    `Added ${courseCode} on ${schedules.length} day${schedules.length === 1 ? "" : "s"}: ${dayNames}.`
  );
  showToast(`Added ${courseCode}`);

  form.reset();
  resetScheduleRows();
  document.getElementById("course-code").focus();
});

weekGrid.addEventListener("click", (event) => {
  const removeBtn = event.target.closest(".remove-btn");
  if (removeBtn) {
    const day = removeBtn.dataset.day;
    const id = removeBtn.dataset.id;
    const removed = findClass(day, id);

    timetable[day] = timetable[day].filter((item) => item.id !== id);
    saveTimetable(timetable);
    render(timetable);
    clearMessages();
    showToast(removed ? `Removed ${removed.courseCode}` : "Class removed");
    return;
  }

  const editBtn = event.target.closest(".edit-btn");
  const block = event.target.closest(".course-block");
  if (editBtn) {
    openEditModal(editBtn.dataset.day, editBtn.dataset.id);
    return;
  }

  if (block) {
    openEditModal(block.dataset.day, block.dataset.id);
  }
});

editModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-modal]")) {
    closeEditModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !editModal.hidden) {
    closeEditModal();
  }
});

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  editError.hidden = true;

  const id = editId.value;
  const originalDay = editOriginalDay.value;
  const courseCode = editCourseCode.value.trim();
  const courseName = editCourseName.value.trim();
  const day = editDay.value;
  const startTime = editStartTime.value;
  const endTime = editEndTime.value;
  const syncCode = editSyncCode.checked;

  const existing = findClass(originalDay, id);
  if (!existing) {
    editError.textContent = "This class could not be found.";
    editError.hidden = false;
    return;
  }

  if (!courseCode || !courseName || !startTime || !endTime) {
    editError.textContent = "Please fill in every field.";
    editError.hidden = false;
    return;
  }

  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    editError.textContent = "End time must be after start time.";
    editError.hidden = false;
    return;
  }

  if (timeToMinutes(startTime) < DAY_START || timeToMinutes(endTime) > DAY_END) {
    editError.textContent = "Classes must fall between 8:00 AM and 8:00 PM.";
    editError.hidden = false;
    return;
  }

  const oldCode = existing.courseCode;

  if (syncCode) {
    for (const d of DAYS) {
      for (const item of timetable[d]) {
        if (item.courseCode.toLowerCase() === oldCode.toLowerCase()) {
          item.courseCode = courseCode;
          item.courseName = courseName;
        }
      }
    }
  }

  const updated = {
    id,
    courseCode,
    courseName,
    startTime,
    endTime,
  };

  if (day === originalDay) {
    const index = timetable[originalDay].findIndex((item) => item.id === id);
    timetable[originalDay][index] = updated;
  } else {
    timetable[originalDay] = timetable[originalDay].filter((item) => item.id !== id);
    timetable[day].push(updated);
  }

  saveTimetable(timetable);
  render(timetable);
  closeEditModal();
  clearMessages();
  showToast(`Updated ${courseCode}`);
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
