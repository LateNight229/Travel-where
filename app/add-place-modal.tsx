"use client";

import { Camera, ImagePlus, Link2, MapPin, Plus, Upload, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { NewPlaceInput, Place, PlaceType, TripDay } from "../lib/trip-types";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=84";

export default function AddPlaceModal({ days, defaultDayId, initialPlace, onClose, onAdd }: { days: TripDay[]; defaultDayId: string; initialPlace?: Place | null; onClose: () => void; onAdd: (input: NewPlaceInput) => Promise<void> | void }) {
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | undefined>();
  const [imageUrl, setImageUrl] = useState(initialPlace?.image ?? "");
  const [type, setType] = useState<PlaceType>(initialPlace?.type ?? "checkin");
  const preview = useMemo(() => file ? URL.createObjectURL(file) : imageUrl || DEFAULT_IMAGE, [file, imageUrl]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await onAdd({
        dayId: String(values.get("dayId")),
        title: String(values.get("title")),
        subtitle: String(values.get("subtitle")),
        type,
        time: String(values.get("time")),
        duration: String(values.get("duration")),
        note: String(values.get("note")),
        image: imageUrl || DEFAULT_IMAGE,
        imageFile: file,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card add-place-modal" role="dialog" aria-modal="true" aria-labelledby="add-place-title">
        <header className="modal-header"><div><span className="eyebrow"><Plus size={13} /> {initialPlace ? "Chỉnh sửa điểm đến" : "Điểm đến mới"}</span><h2 id="add-place-title">{initialPlace ? "Cập nhật hành trình" : "Thêm vào hành trình"}</h2></div><button type="button" className="icon-button" aria-label="Đóng" onClick={onClose}><X size={18} /></button></header>
        <form onSubmit={submit}>
          <div className="photo-picker">
            <img src={preview} alt="Xem trước ảnh bìa" />
            <div className="photo-picker-overlay" />
            <label className="upload-photo-button"><Upload size={16} /> Chọn ảnh<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0])} /></label>
          </div>
          <div className="form-grid">
            <label className="field wide"><span>Tên địa điểm</span><input name="title" required defaultValue={initialPlace?.title} placeholder="Ví dụ: Phố cổ Hội An" /></label>
            <label className="field wide"><span>Địa chỉ hoặc link Google Maps</span><div className="field-icon"><MapPin size={16} /><input name="subtitle" required defaultValue={initialPlace?.subtitle} placeholder="Nhập địa chỉ hoặc dán link" /></div></label>
            <div className="field wide"><span>Phân loại</span><div className="category-picker">{(["checkin", "food", "coffee", "hotel"] as PlaceType[]).map((value) => <button type="button" key={value} className={type === value ? "active" : ""} onClick={() => setType(value)}>{value === "checkin" ? "Check-in" : value === "food" ? "Ăn uống" : value === "coffee" ? "Cà phê" : "Khách sạn"}</button>)}</div></div>
            <label className="field"><span>Ngày</span><select name="dayId" defaultValue={defaultDayId}>{days.map((day) => <option key={day.id} value={day.id}>{day.label} · {day.shortDate}</option>)}</select></label>
            <label className="field"><span>Thời gian</span><input name="time" type="time" defaultValue={initialPlace?.time ?? "09:00"} required /></label>
            <label className="field"><span>Ở lại khoảng</span><select name="duration" defaultValue={initialPlace?.duration ?? "1 giờ"}><option>30 phút</option><option>45 phút</option><option>1 giờ</option><option>1 giờ 30 phút</option><option>2 giờ</option><option>2 giờ 30 phút</option><option>3 giờ</option><option>4 giờ</option></select></label>
            <label className="field"><span>Ảnh từ đường dẫn</span><div className="field-icon"><Link2 size={16} /><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://…" /></div></label>
            <label className="field wide"><span>Ghi chú</span><textarea name="note" rows={3} defaultValue={initialPlace?.note} placeholder="Món nên thử, giờ đẹp để chụp ảnh…" /></label>
          </div>
          <div className="modal-footer"><span><ImagePlus size={15} /> Ảnh được lưu trong vùng riêng của tài khoản.</span><div><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button" disabled={submitting}><Camera size={16} /> {submitting ? "Đang lưu…" : initialPlace ? "Lưu thay đổi" : "Thêm địa điểm"}</button></div></div>
        </form>
      </section>
    </div>
  );
}
