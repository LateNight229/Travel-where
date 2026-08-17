"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Heart,
  Info,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { formatVnd, searchHotels, type HotelResult, type HotelSearchInput } from "../lib/hotel-provider";
import { addDaysIso, todayIso } from "../lib/trip-model";

function defaultSearch(initialSearch?: Partial<HotelSearchInput>): HotelSearchInput {
  const today = todayIso();
  return {
    destination: initialSearch?.destination ?? "",
    checkIn: initialSearch?.checkIn ?? today,
    checkOut: initialSearch?.checkOut ?? addDaysIso(today, 1),
    adults: 2,
    children: 0,
    minPrice: 500000,
    maxPrice: 2000000,
    rating: 4,
    hotelClass: [3, 4, 5],
    freeCancellation: false,
    sort: "value",
    ...initialSearch,
  };
}

function HotelCard({ hotel, shortlisted, onToggle, onSelect }: { hotel: HotelResult; shortlisted: boolean; onToggle: () => void; onSelect: () => void }) {
  return (
    <article className="hotel-card">
      <div className="hotel-image-wrap">
        <img src={hotel.image} alt="" />
        {hotel.valueScore >= 92 ? <span className="value-badge"><Sparkles size={12} /> Đáng tiền</span> : null}
        <button type="button" className={`hotel-heart ${shortlisted ? "active" : ""}`} onClick={onToggle} aria-label={shortlisted ? `Bỏ ${hotel.name} khỏi danh sách` : `Thêm ${hotel.name} vào danh sách`}><Heart size={18} fill={shortlisted ? "currentColor" : "none"} /></button>
      </div>
      <div className="hotel-card-body">
        <div className="hotel-rating-row"><span>{hotel.hotelClass} sao</span><strong><Star size={13} fill="currentColor" /> {hotel.rating.toFixed(1)}</strong><small>{hotel.reviews.toLocaleString("vi-VN")} đánh giá</small></div>
        <h3>{hotel.name}</h3>
        <p className="hotel-address"><MapPin size={14} /> {hotel.address}</p>
        <div className="hotel-amenities">{hotel.amenities.slice(0, 3).map((amenity) => <span key={amenity}><Check size={11} /> {amenity}</span>)}</div>
        <p className="hotel-reason"><BadgeCheck size={14} /> {hotel.reason}</p>
        <div className="hotel-price-row">
          <div><span>mỗi đêm</span><strong>{formatVnd(hotel.pricePerNight)}</strong><small>Tổng {formatVnd(hotel.totalPrice)}</small></div>
          <button type="button" className="secondary-button" onClick={onSelect}>Chi tiết <ArrowUpRight size={15} /></button>
        </div>
      </div>
    </article>
  );
}

function HotelDetail({ hotel, shortlisted, onClose, onToggle, onConfirm }: { hotel: HotelResult; shortlisted: boolean; onClose: () => void; onToggle: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card hotel-detail-modal" role="dialog" aria-modal="true" aria-labelledby="hotel-detail-title">
        <div className="hotel-detail-gallery"><img src={hotel.images[0] || hotel.image} alt="" /><div>{hotel.images.slice(1, 3).map((image) => <img src={image} alt="" key={image} />)}</div><button className="icon-button" type="button" aria-label="Đóng" onClick={onClose}><X size={18} /></button></div>
        <div className="hotel-detail-content">
          <div className="hotel-detail-heading"><div><span className="eyebrow">{hotel.hotelClass} sao · {hotel.source}</span><h2 id="hotel-detail-title">{hotel.name}</h2><p><MapPin size={15} /> {hotel.address}</p></div><div className="detail-score"><Star size={16} fill="currentColor" /><strong>{hotel.rating.toFixed(1)}</strong><span>{hotel.reviews.toLocaleString("vi-VN")} đánh giá</span></div></div>
          <div className="why-card"><Sparkles size={18} /><div><strong>Vì sao đây là lựa chọn tốt?</strong><p>{hotel.reason}</p></div></div>
          <div className="detail-sections"><div><h3>Tiện nghi nổi bật</h3><div className="amenity-list">{hotel.amenities.map((amenity) => <span key={amenity}><CheckCircle2 size={15} /> {amenity}</span>)}</div></div><div><h3>Điều kiện</h3><p className={hotel.freeCancellation ? "positive-copy" : "muted-copy"}>{hotel.freeCancellation ? "Có hủy miễn phí theo điều kiện nhà cung cấp" : "Giá này có thể không bao gồm hủy miễn phí"}</p><p className="muted-copy">Giá được cập nhật lúc {new Date(hotel.fetchedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} và có thể thay đổi khi đặt.</p></div></div>
          <div className="hotel-detail-footer"><div><span>Giá từ</span><strong>{formatVnd(hotel.pricePerNight)} <small>/ đêm</small></strong><p>Tổng kỳ nghỉ {formatVnd(hotel.totalPrice)}</p></div><div><button type="button" className={`secondary-button ${shortlisted ? "selected" : ""}`} onClick={onToggle}><Heart size={16} fill={shortlisted ? "currentColor" : "none"} /> {shortlisted ? "Đã lưu" : "Lưu để so sánh"}</button><a className="secondary-button external-button" href={hotel.link} target="_blank" rel="noreferrer">Xem giá & đặt <ExternalLink size={15} /></a><button type="button" className="primary-button" onClick={onConfirm}><BedDouble size={16} /> Chọn khách sạn</button></div></div>
        </div>
      </section>
    </div>
  );
}

export default function HotelFinder({ shortlist, initialSearch, onShortlistChange, onConfirmHotel }: { shortlist: HotelResult[]; initialSearch?: Partial<HotelSearchInput>; onShortlistChange: (hotel: HotelResult) => void; onConfirmHotel: (hotel: HotelResult) => void }) {
  const [form, setForm] = useState<HotelSearchInput>(() => defaultSearch(initialSearch));
  const [results, setResults] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [error, setError] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<HotelResult | null>(null);

  const shortlistIds = useMemo(() => new Set(shortlist.map((hotel) => hotel.id)), [shortlist]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await searchHotels(form);
      setResults(response.hotels);
      setMode(response.mode);
      setSearched(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tìm khách sạn.");
    } finally {
      setLoading(false);
    }
  }

  function toggleClass(value: number) {
    setForm((current) => ({ ...current, hotelClass: current.hotelClass.includes(value) ? current.hotelClass.filter((item) => item !== value) : [...current.hotelClass, value] }));
  }

  return (
    <section className="hotel-finder">
      <div className="finder-hero">
        <div><span className="eyebrow"><Sparkles size={14} /> Hotel Finder</span><h2>Tìm một nơi ở thật đáng tiền</h2><p>So sánh theo giá, đánh giá, vị trí và điều kiện hủy — rồi lưu lựa chọn tốt nhất vào chuyến đi.</p></div>
        <div className="finder-orb"><BedDouble size={30} /></div>
      </div>

      <form className="hotel-search-card" onSubmit={submit}>
        <label className="search-main-field"><span>Điểm đến</span><div><Search size={18} /><input value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} required /></div></label>
        <label><span>Nhận phòng</span><div><CalendarDays size={16} /><input type="date" value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} required /></div></label>
        <label><span>Trả phòng</span><div><CalendarDays size={16} /><input type="date" value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} required /></div></label>
        <label><span>Khách</span><div><Users size={16} /><select value={form.adults} onChange={(event) => setForm({ ...form, adults: Number(event.target.value) })}><option value="1">1 người lớn</option><option value="2">2 người lớn</option><option value="3">3 người lớn</option><option value="4">4 người lớn</option></select><ChevronDown size={14} /></div></label>
        <button className="primary-button finder-submit" type="submit" disabled={loading}>{loading ? <Loader2 size={17} className="spin" /> : <Search size={17} />}{loading ? "Đang tìm…" : "Tìm khách sạn"}</button>
        <div className="finder-filters">
          <span><SlidersHorizontal size={14} /> Bộ lọc</span>
          <label>Giá từ <input type="number" min="0" step="100000" value={form.minPrice} onChange={(event) => setForm({ ...form, minPrice: Number(event.target.value) })} /></label>
          <label>đến <input type="number" min="0" step="100000" value={form.maxPrice} onChange={(event) => setForm({ ...form, maxPrice: Number(event.target.value) })} /></label>
          <div className="star-filters">{[3,4,5].map((star) => <button type="button" key={star} className={form.hotelClass.includes(star) ? "active" : ""} onClick={() => toggleClass(star)}>{star}★</button>)}</div>
          <label className="toggle-filter"><input type="checkbox" checked={form.freeCancellation} onChange={(event) => setForm({ ...form, freeCancellation: event.target.checked })} /><span /> Hủy miễn phí</label>
        </div>
      </form>

      {shortlist.length ? <section className="shortlist-strip"><div><span className="eyebrow"><Heart size={13} fill="currentColor" /> Đang cân nhắc</span><h3>{shortlist.length} khách sạn đã lưu</h3></div><div className="shortlist-items">{shortlist.slice(0, 4).map((hotel) => <button type="button" key={hotel.id} onClick={() => setSelectedHotel(hotel)}><img src={hotel.image} alt="" /><span>{hotel.name}</span><strong>{formatVnd(hotel.pricePerNight)}</strong></button>)}</div></section> : null}

      {!searched ? <div className="finder-empty"><span><Search size={25} /></span><h3>Sẵn sàng khám phá</h3><p>Điền khoảng giá mong muốn và bấm “Tìm khách sạn”.</p><button type="button" className="secondary-button" onClick={() => submit()}><Sparkles size={16} /> Xem kết quả mẫu</button></div> : null}

      {error ? <div className="finder-error"><Info size={17} /> {error}</div> : null}

      {searched && !loading ? (
        <div className="finder-results">
          <div className="results-toolbar"><div><span>{mode === "demo" ? "Dữ liệu minh họa" : "Giá đang hiển thị"}</span><h3>{results.length} chỗ nghỉ phù hợp</h3></div><label>Sắp xếp<select value={form.sort} onChange={(event) => { const sort = event.target.value as HotelSearchInput["sort"]; setForm({ ...form, sort }); setResults((current) => [...current].sort((a, b) => sort === "price" ? a.pricePerNight - b.pricePerNight : sort === "rating" ? b.rating - a.rating : b.valueScore - a.valueScore)); }}><option value="value">Đáng tiền nhất</option><option value="price">Giá thấp nhất</option><option value="rating">Đánh giá cao nhất</option></select></label></div>
          {mode === "demo" ? <p className="demo-data-note"><Info size={15} /> Đây là dữ liệu mẫu để thử giao diện. Sau khi cấu hình SerpAPI, kết quả sẽ dùng giá tìm thấy theo ngày bạn chọn.</p> : null}
          <div className="hotel-grid">{results.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} shortlisted={shortlistIds.has(hotel.id)} onToggle={() => onShortlistChange(hotel)} onSelect={() => setSelectedHotel(hotel)} />)}</div>
        </div>
      ) : null}

      {selectedHotel ? <HotelDetail hotel={selectedHotel} shortlisted={shortlistIds.has(selectedHotel.id)} onClose={() => setSelectedHotel(null)} onToggle={() => onShortlistChange(selectedHotel)} onConfirm={() => { onConfirmHotel(selectedHotel); setSelectedHotel(null); }} /> : null}
    </section>
  );
}
