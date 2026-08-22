"use client";

import { Clock3 } from "lucide-react";
import { useState } from "react";
import { normalizeTime24 } from "../lib/time-24";

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

export default function Time24Input({
  name,
  defaultValue,
  label,
}: {
  name: string;
  defaultValue: string;
  label: string;
}) {
  const initialTime = normalizeTime24(defaultValue);
  const [hour, setHour] = useState(initialTime.slice(0, 2));
  const [minute, setMinute] = useState(initialTime.slice(3, 5));
  const value = `${hour}:${minute}`;

  return (
    <div className="time-24-input" role="group" aria-label={`${label}, định dạng 24 giờ`}>
      <Clock3 size={16} aria-hidden="true" />
      <select value={hour} onChange={(event) => setHour(event.target.value)} aria-label={`${label}: giờ`}>
        {HOURS.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <span className="time-24-separator" aria-hidden="true">:</span>
      <select value={minute} onChange={(event) => setMinute(event.target.value)} aria-label={`${label}: phút`}>
        {MINUTES.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <span className="time-24-badge" aria-hidden="true">24h</span>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
