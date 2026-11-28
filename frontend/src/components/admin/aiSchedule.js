export const DAYS = [
  { value: "daily", labelKey: "ai_day_daily" },
  { value: "1", labelKey: "ai_day_mon" },
  { value: "2", labelKey: "ai_day_tue" },
  { value: "3", labelKey: "ai_day_wed" },
  { value: "4", labelKey: "ai_day_thu" },
  { value: "5", labelKey: "ai_day_fri" },
  { value: "6", labelKey: "ai_day_sat" },
  { value: "0", labelKey: "ai_day_sun" },
];

// Parse "M H * * D" cron → { day, time }
export const parseSchedule = (cron) => {
  if (!cron) return { day: "daily", time: "08:00" };
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return { day: "daily", time: "08:00" };
  const [min, hour, , , dow] = parts;
  const day = dow === "*" ? "daily" : dow;
  const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  return { day, time };
};

export const buildCron = (day, time) => {
  const [hour, min] = time.split(":");
  return `${parseInt(min, 10)} ${parseInt(hour, 10)} * * ${day === "daily" ? "*" : day}`;
};
