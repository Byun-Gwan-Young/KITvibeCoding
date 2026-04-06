import { PRIORITY_LABELS, SUBJECT_LABELS, WEAKNESS_LABELS } from "./constants.js";

export function formatScore(value, suffix = "점") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Math.round(Number(value) * 10) / 10}${suffix}`;
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Math.round(Number(value) * 10) / 10}%`;
}

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function toSubjectLabel(value) {
  return SUBJECT_LABELS[value] ?? value;
}

export function toWeaknessLabel(value) {
  return WEAKNESS_LABELS[value] ?? value;
}

export function toPriorityLabel(value) {
  return PRIORITY_LABELS[value] ?? value;
}
