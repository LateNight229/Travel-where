"use client";

import { CalendarDays, MapPin, Plus, Save, Users, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { TripDocument, TripSettingsInput } from "../lib/trip-types";

type SaveResult = { ok: true } | { ok: false; error: string };

export default function TripSettingsModal({
  mode,
  trip,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  trip: TripDocument;
  onClose: () => void;
  onSave: (input: TripSettingsInput) => SaveResult;
}) {
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const input: TripSettingsInput = {
      title: String(values.get("title")).trim(),
      destination: String(values.get("destination")).trim(),
      startDate: String(values.get("startDate")),
      endDate: String(values.get("endDate")),
      travelers: Number(values.get("travelers")),
    };
    if (input.endDate < input.startDate) {
      setError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
      return;
    }
    const result = onSave(input);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card trip-settings-modal" role="dialog" aria-modal="true" aria-labelledby="trip-settings-title">
        <header className="modal-header">
          <div>
            <span className="eyebrow">{mode === "create" ? <Plus size={13} /> : <Save size={13} />} {mode === "create" ? "Chuyến đi mới" : "Thiết lập chuyến đi"}</span>
            <h2 id="trip-settings-title">{mode === "create" ? "Tạo một kế hoạch độc lập" : `Chỉnh sửa ${trip.title}`}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Đóng" onClick={onClose}><X size={18} /></button>
        </header>
        <form onSubmit={submit}>
          <div className="trip-settings-intro">
            <CalendarDays size={20} />
            <p><strong>Ngày 1 bắt đầu đúng ngày bạn chọn.</strong><span>Ứng dụng tự tạo đủ các ngày từ ngày bắt đầu đến ngày kết thúc.</span></p>
          </div>
          <div className="form-grid">
            <label className="field wide"><span>Tên chuyến đi</span><input name="title" required defaultValue={trip.title} placeholder="Ví dụ: Đà Lạt cuối tuần" /></label>
            <label className="field wide"><span>Điểm đến</span><div className="field-icon"><MapPin size={16} /><input name="destination" defaultValue={trip.destination} placeholder="Ví dụ: Đà Lạt, Lâm Đồng" /></div></label>
            <label className="field"><span>Ngày bắt đầu · Ngày 1</span><input name="startDate" type="date" required defaultValue={trip.startDate} /></label>
            <label className="field"><span>Ngày kết thúc</span><input name="endDate" type="date" required defaultValue={trip.endDate} /></label>
            <label className="field"><span>Số người</span><div className="field-icon"><Users size={16} /><input name="travelers" type="number" min="1" max="30" required defaultValue={trip.travelers} /></div></label>
          </div>
          {error ? <p className="form-error trip-form-error">{error}</p> : null}
          <div className="modal-footer">
            <span>Mỗi chuyến có timeline và danh sách khách sạn riêng.</span>
            <div><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button"><Save size={16} /> {mode === "create" ? "Tạo chuyến đi" : "Lưu thay đổi"}</button></div>
          </div>
        </form>
      </section>
    </div>
  );
}
