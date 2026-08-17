"use client";

import { BedDouble, CalendarDays, Clock3, MapPin, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { HotelResult } from "../lib/hotel-provider";
import type { TripDocument } from "../lib/trip-types";

export type HotelScheduleInput = {
  tripId: string;
  dayId: string;
  time: string;
};

export default function ScheduleHotelModal({
  hotel,
  trips,
  defaultTripId,
  onClose,
  onConfirm,
}: {
  hotel: HotelResult;
  trips: TripDocument[];
  defaultTripId: string;
  onClose: () => void;
  onConfirm: (input: HotelScheduleInput) => string | null;
}) {
  const [tripId, setTripId] = useState(defaultTripId || trips[0]?.id || "");
  const [dayId, setDayId] = useState(() => trips.find((trip) => trip.id === (defaultTripId || trips[0]?.id))?.days[0]?.id ?? "");
  const [error, setError] = useState("");
  const selectedTrip = useMemo(() => trips.find((trip) => trip.id === tripId) ?? trips[0], [tripId, trips]);

  function changeTrip(nextTripId: string) {
    setTripId(nextTripId);
    setDayId(trips.find((trip) => trip.id === nextTripId)?.days[0]?.id ?? "");
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const nextError = onConfirm({ tripId, dayId, time: String(values.get("time")) });
    if (nextError) {
      setError(nextError);
      return;
    }
    onClose();
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card schedule-hotel-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-hotel-title">
        <header className="modal-header">
          <div><span className="eyebrow"><BedDouble size={13} /> Thêm khách sạn vào kế hoạch</span><h2 id="schedule-hotel-title">Chọn đúng chuyến đi và ngày</h2></div>
          <button type="button" className="icon-button" aria-label="Đóng" onClick={onClose}><X size={18} /></button>
        </header>
        <form onSubmit={submit}>
          <div className="hotel-schedule-preview"><img src={hotel.image} alt="" /><div><strong>{hotel.name}</strong><span><MapPin size={13} /> {hotel.address}</span></div></div>
          <div className="form-grid">
            <label className="field wide"><span>Thêm vào chuyến đi nào?</span><select value={tripId} onChange={(event) => changeTrip(event.target.value)}>{trips.map((trip) => <option value={trip.id} key={trip.id}>{trip.title} · {trip.dateRange}</option>)}</select></label>
            <label className="field"><span>Ngày nhận phòng trong kế hoạch</span><div className="field-icon"><CalendarDays size={16} /><select value={dayId} onChange={(event) => setDayId(event.target.value)}>{selectedTrip?.days.map((day) => <option value={day.id} key={day.id}>{day.label} · {day.shortDate}</option>)}</select></div></label>
            <label className="field"><span>Giờ nhận phòng</span><div className="field-icon"><Clock3 size={16} /><input name="time" type="time" defaultValue="14:00" required /></div></label>
          </div>
          {error ? <p className="form-error trip-form-error">{error}</p> : null}
          <div className="modal-footer"><span>Khách sạn chỉ được thêm vào timeline của chuyến bạn chọn.</span><div><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button"><BedDouble size={16} /> Thêm vào kế hoạch</button></div></div>
        </form>
      </section>
    </div>
  );
}
