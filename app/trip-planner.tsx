"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import {
  BedDouble,
  CalendarDays,
  Camera,
  Check,
  Clock3,
  Cloud,
  Coffee,
  Compass,
  Download,
  Heart,
  Home,
  LockKeyhole,
  LogOut,
  Map,
  MapPin,
  Menu,
  MoreHorizontal,
  Navigation,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  Utensils,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddPlaceModal from "./add-place-modal";
import HotelFinder from "./hotel-finder";
import PrivateLogin from "./private-login";
import ScheduleHotelModal, { type HotelScheduleInput } from "./schedule-hotel-modal";
import TripSettingsModal from "./trip-settings-modal";
import { appConfig } from "../lib/app-config";
import type { HotelResult } from "../lib/hotel-provider";
import { createId } from "../lib/id";
import {
  addDaysIso,
  buildTripDays,
  createTripDocument,
  formatTripDateRange,
  normalizeTripDocument,
  todayIso,
  tripDayCount,
} from "../lib/trip-model";
import { getSupabaseClient, loadTripDocuments, saveTripDocument, uploadTripPhoto } from "../lib/supabase-client";
import type { NewPlaceInput, Place, PlaceType, TripDocument, TripSettingsInput } from "../lib/trip-types";
import { compareTime24, normalizeTime24 } from "../lib/time-24";

type View = "plan" | "discover" | "map" | "today";
type AuthState = "loading" | "signed-out" | "signed-in" | "demo";
type SaveState = "idle" | "saving" | "saved" | "error";
type TripEditorState = { mode: "create" | "edit"; trip: TripDocument } | null;

const TYPE_META: Record<PlaceType, { label: string; icon: typeof BedDouble; className: string }> = {
  hotel: { label: "Khách sạn", icon: BedDouble, className: "hotel" },
  food: { label: "Ăn uống", icon: Utensils, className: "food" },
  checkin: { label: "Check-in", icon: Camera, className: "checkin" },
  coffee: { label: "Cà phê", icon: Coffee, className: "coffee" },
};

const NAV_ITEMS: Array<{ id: View; label: string; mobileLabel: string; icon: typeof Home }> = [
  { id: "plan", label: "Kế hoạch", mobileLabel: "Kế hoạch", icon: CalendarDays },
  { id: "discover", label: "Khám phá", mobileLabel: "Khám phá", icon: Compass },
  { id: "map", label: "Bản đồ", mobileLabel: "Bản đồ", icon: Map },
  { id: "today", label: "Đang đi", mobileLabel: "Hôm nay", icon: Navigation },
];

const DEMO_CACHE_KEY = "di-dau-day-trips-v2";
const LEGACY_DEMO_CACHE_KEY = "di-dau-day-trip-v1";
const ACTIVE_TRIP_KEY = "di-dau-day-active-trip-v2";
const FALLBACK_TRIP_IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=84";

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button className="icon-button" type="button" aria-label={label} onClick={onClick}>{children}</button>;
}

function PlaceCard({ place, compact = false, onToggle, onOpen, onSave }: { place: Place; compact?: boolean; onToggle: (id: string) => void; onOpen: () => void; onSave: (id: string) => void }) {
  const meta = TYPE_META[place.type];
  const TypeIcon = meta.icon;
  return (
    <article className={`place-card ${compact ? "compact" : ""} ${place.visited ? "visited" : ""}`}>
      <button className="place-card-image-wrap" type="button" onClick={onOpen} aria-label={`Mở ${place.title}`}>
        <img className="place-card-image" src={place.image} alt="" />
        <span className={`place-type-pill ${meta.className}`}><TypeIcon size={13} strokeWidth={2.2} />{meta.label}</span>
      </button>
      <button className={`heart-button ${place.saved ? "active" : ""}`} type="button" onClick={() => onSave(place.id)} aria-label={`Lưu ${place.title}`}><Heart size={17} fill={place.saved ? "currentColor" : "none"} /></button>
      <div className="place-card-body">
        <div className="place-card-copy">
          <div className="time-line"><Clock3 size={14} /><span>{place.time}</span><span className="dot-separator">•</span><span>{place.duration}</span></div>
          <button className="place-title-button" type="button" onClick={onOpen}><h3>{place.title}</h3></button>
          <p className="address-line"><MapPin size={14} />{place.subtitle}</p>
          {place.note && !compact ? <p className="place-note">“{place.note}”</p> : null}
        </div>
        <div className="place-card-actions">
          <button type="button" className={`round-check ${place.visited ? "active" : ""}`} aria-label={place.visited ? "Đánh dấu chưa đến" : "Đánh dấu đã đến"} onClick={() => onToggle(place.id)}><Check size={16} /></button>
          <IconButton label={`Xem thêm về ${place.title}`} onClick={onOpen}><MoreHorizontal size={18} /></IconButton>
        </div>
      </div>
    </article>
  );
}

async function imageToDataUrl(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });
  const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function normalizeMany(values: Array<{ tripId: string; document: unknown }>): TripDocument[] {
  return values
    .map((item, index) => normalizeTripDocument(item.document, item.tripId, index + 1))
    .filter((trip): trip is TripDocument => Boolean(trip))
    .sort((a, b) => a.position - b.position);
}

export default function TripPlannerApp() {
  const [view, setView] = useState<View>("plan");
  const [trips, setTrips] = useState<TripDocument[]>([]);
  const [activeTripId, setActiveTripId] = useState("");
  const [activeDayId, setActiveDayId] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ dayId: string; place: Place } | null>(null);
  const [editingPlace, setEditingPlace] = useState<{ dayId: string; place: Place } | null>(null);
  const [tripEditor, setTripEditor] = useState<TripEditorState>(null);
  const [pendingHotel, setPendingHotel] = useState<HotelResult | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(appConfig.demoMode ? "demo" : "loading");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [toast, setToast] = useState("");

  const activeTrip = useMemo(() => trips.find((trip) => trip.id === activeTripId) ?? trips[0], [activeTripId, trips]);
  const days = useMemo(() => activeTrip?.days ?? [], [activeTrip]);
  const activeDay = useMemo(() => days.find((day) => day.id === activeDayId) ?? days[0], [activeDayId, days]);
  const placeCount = useMemo(() => days.reduce((total, day) => total + day.places.length, 0), [days]);
  const tripImage = useMemo(() => days.flatMap((day) => day.places)[0]?.image || FALLBACK_TRIP_IMAGE, [days]);
  const hotelSearchInitial = useMemo(() => activeTrip ? {
    destination: activeTrip.destination || activeTrip.title,
    checkIn: activeTrip.startDate,
    checkOut: activeTrip.endDate > activeTrip.startDate ? activeTrip.endDate : addDaysIso(activeTrip.startDate, 1),
    adults: activeTrip.travelers,
  } : undefined, [activeTrip]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!activeTrip) return;
    if (!activeTrip.days.some((day) => day.id === activeDayId)) setActiveDayId(activeTrip.days[0]?.id ?? "");
  }, [activeDayId, activeTrip]);

  useEffect(() => {
    if (appConfig.demoMode) {
      let loaded: TripDocument[] = [];
      let requestedActiveId = "";
      try {
        const cached = window.localStorage.getItem(DEMO_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { trips?: unknown[]; activeTripId?: string };
          loaded = normalizeMany((parsed.trips ?? []).map((document, index) => ({
            tripId: typeof document === "object" && document && "id" in document ? String((document as { id: unknown }).id) : `demo-trip-${index + 1}`,
            document,
          })));
          requestedActiveId = parsed.activeTripId ?? "";
        }
        if (!loaded.length) {
          const legacy = window.localStorage.getItem(LEGACY_DEMO_CACHE_KEY);
          if (legacy) loaded = normalizeMany([{ tripId: "demo-trip-migrated", document: JSON.parse(legacy) }]);
        }
      } catch {
        window.localStorage.removeItem(DEMO_CACHE_KEY);
      }
      if (!loaded.length) loaded = [createTripDocument(1)];
      const remembered = requestedActiveId || window.localStorage.getItem(ACTIVE_TRIP_KEY) || "";
      const selected = loaded.find((trip) => trip.id === remembered) ?? loaded[0];
      setTrips(loaded);
      setActiveTripId(selected.id);
      setActiveDayId(selected.days[0]?.id ?? "");
      setHydrated(true);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      setUserId(user?.id ?? "");
      setUserEmail(user?.email ?? "");
      setAuthState(user ? "signed-in" : "signed-out");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setUserId(user?.id ?? "");
      setUserEmail(user?.email ?? "");
      setAuthState(user ? "signed-in" : "signed-out");
      if (!user) {
        setHydrated(false);
        setTrips([]);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId || appConfig.demoMode) return;
    let mounted = true;
    setHydrated(false);
    loadTripDocuments(userId)
      .then((records) => {
        if (!mounted) return;
        const loaded = normalizeMany(records);
        const available = loaded.length ? loaded : [createTripDocument(1)];
        const remembered = window.localStorage.getItem(ACTIVE_TRIP_KEY) || "";
        const selected = available.find((trip) => trip.id === remembered) ?? available[0];
        setTrips(available);
        setActiveTripId(selected.id);
        setActiveDayId(selected.days[0]?.id ?? "");
      })
      .catch(() => {
        if (!mounted) return;
        const created = createTripDocument(1);
        setTrips([created]);
        setActiveTripId(created.id);
        setActiveDayId(created.days[0].id);
        setSaveState("error");
      })
      .finally(() => { if (mounted) setHydrated(true); });
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    if (!activeTripId) return;
    window.localStorage.setItem(ACTIVE_TRIP_KEY, activeTripId);
  }, [activeTripId]);

  useEffect(() => {
    if (!hydrated || !trips.length) return;
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      const savedAt = new Date().toISOString();
      const payloads = trips.map((trip) => ({ ...trip, dateRange: formatTripDateRange(trip.startDate, trip.endDate), updatedAt: savedAt }));
      try {
        if (appConfig.demoMode) {
          window.localStorage.setItem(DEMO_CACHE_KEY, JSON.stringify({ version: 2, activeTripId, trips: payloads }));
        } else if (userId) {
          await Promise.all(payloads.map((trip) => saveTripDocument(userId, trip.id, trip)));
        }
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 850);
    return () => window.clearTimeout(timer);
  }, [activeTripId, hydrated, trips, userId]);

  const updateTrip = (tripId: string, updater: (trip: TripDocument) => TripDocument) => {
    setTrips((current) => current.map((trip) => trip.id === tripId ? updater(trip) : trip));
  };

  const updateActiveTrip = (updater: (trip: TripDocument) => TripDocument) => {
    if (activeTrip) updateTrip(activeTrip.id, updater);
  };

  const updatePlace = (placeId: string, updater: (place: Place) => Place) => {
    updateActiveTrip((trip) => ({ ...trip, days: trip.days.map((day) => ({ ...day, places: day.places.map((place) => place.id === placeId ? updater(place) : place) })) }));
  };

  const toggleVisited = (placeId: string) => updatePlace(placeId, (place) => ({ ...place, visited: !place.visited }));
  const toggleSaved = (placeId: string) => updatePlace(placeId, (place) => ({ ...place, saved: !place.saved }));

  const selectTrip = (tripId: string) => {
    const trip = trips.find((item) => item.id === tripId);
    if (!trip) return;
    setActiveTripId(trip.id);
    setActiveDayId(trip.days[0]?.id ?? "");
    setView("plan");
    setMobileMenu(false);
  };

  const selectView = (nextView: View) => {
    if (nextView === "today" && activeTrip) {
      const today = activeTrip.days.find((day) => day.dateISO === todayIso());
      if (today) setActiveDayId(today.id);
    }
    setView(nextView);
    setMobileMenu(false);
  };

  const goToGoogleMaps = (place: Place) => {
    const query = encodeURIComponent(`${place.location.lat},${place.location.lng}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  const openDayRoute = () => {
    if (!activeDay?.places.length) return;
    if (activeDay.places.length === 1) return goToGoogleMaps(activeDay.places[0]);
    const coordinates = activeDay.places.map((place) => `${place.location.lat},${place.location.lng}`);
    const origin = encodeURIComponent(coordinates[0]);
    const destination = encodeURIComponent(coordinates[coordinates.length - 1]);
    const waypoints = coordinates.slice(1, -1).map(encodeURIComponent).join("%7C");
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=driving`, "_blank", "noopener,noreferrer");
  };

  const savePlace = async (input: NewPlaceInput) => {
    if (!activeTrip) return;
    const time = normalizeTime24(input.time);
    let image = input.image;
    if (input.imageFile) image = appConfig.demoMode ? await imageToDataUrl(input.imageFile) : await uploadTripPhoto(userId, activeTrip.id, input.imageFile);
    if (editingPlace) {
      const changedDay = editingPlace.dayId !== input.dayId;
      const updated: Place = { ...editingPlace.place, title: input.title, subtitle: input.subtitle, type: input.type, time, duration: input.duration, note: input.note, image };
      updateActiveTrip((trip) => ({
        ...trip,
        days: trip.days.map((day) => {
          if (changedDay && day.id === editingPlace.dayId) return { ...day, places: day.places.filter((place) => place.id !== editingPlace.place.id) };
          if (changedDay && day.id === input.dayId) return { ...day, places: [...day.places, updated].sort((a, b) => compareTime24(a.time, b.time)) };
          if (!changedDay) return { ...day, places: day.places.map((place) => place.id === editingPlace.place.id ? updated : place).sort((a, b) => compareTime24(a.time, b.time)) };
          return day;
        }),
      }));
      setToast("Đã cập nhật địa điểm");
      setEditingPlace(null);
      return;
    }
    const place: Place = {
      id: createId(),
      title: input.title,
      subtitle: input.subtitle,
      type: input.type,
      time,
      duration: input.duration,
      note: input.note,
      image,
      location: { lat: 16.0544, lng: 108.2461 },
    };
    updateActiveTrip((trip) => ({ ...trip, days: trip.days.map((day) => day.id === input.dayId ? { ...day, places: [...day.places, place].sort((a, b) => compareTime24(a.time, b.time)) } : day) }));
    setActiveDayId(input.dayId);
    setToast(`Đã thêm địa điểm vào ${activeTrip.title}`);
  };

  const deletePlace = (target: { dayId: string; place: Place }) => {
    if (!window.confirm(`Xóa “${target.place.title}” khỏi lịch trình?`)) return;
    updateActiveTrip((trip) => ({ ...trip, days: trip.days.map((day) => day.id === target.dayId ? { ...day, places: day.places.filter((place) => place.id !== target.place.id) } : day) }));
    setSelectedPlace(null);
    setToast("Đã xóa địa điểm");
  };

  const addDay = () => {
    if (!activeTrip) return;
    const endDate = addDaysIso(activeTrip.endDate, 1);
    const nextDays = buildTripDays(activeTrip.startDate, endDate, activeTrip.days);
    updateActiveTrip((trip) => ({ ...trip, endDate, dateRange: formatTripDateRange(trip.startDate, endDate), days: nextDays }));
    setActiveDayId(nextDays[nextDays.length - 1].id);
    setView("plan");
    setToast(`Đã thêm ${nextDays[nextDays.length - 1].label}`);
  };

  const openCreateTrip = () => setTripEditor({ mode: "create", trip: createTripDocument(trips.length + 1) });
  const openEditTrip = () => { if (activeTrip) setTripEditor({ mode: "edit", trip: activeTrip }); };

  const saveTripSettings = (input: TripSettingsInput): { ok: true } | { ok: false; error: string } => {
    if (!tripEditor) return { ok: false, error: "Không tìm thấy chuyến đi cần lưu." };
    const current = tripEditor.mode === "edit" ? trips.find((trip) => trip.id === tripEditor.trip.id) : undefined;
    const oldDays = current?.days ?? [];
    const nextCount = tripDayCount(input.startDate, input.endDate);
    if (nextCount < oldDays.length && oldDays.slice(nextCount).some((day) => day.places.length)) {
      return { ok: false, error: "Các ngày bị cắt bớt vẫn có địa điểm. Hãy chuyển hoặc xóa các địa điểm đó trước khi rút ngắn chuyến đi." };
    }
    const nextTrip: TripDocument = {
      ...(current ?? tripEditor.trip),
      ...input,
      travelers: Math.max(1, input.travelers),
      dateRange: formatTripDateRange(input.startDate, input.endDate),
      days: buildTripDays(input.startDate, input.endDate, oldDays),
      updatedAt: new Date().toISOString(),
    };
    if (tripEditor.mode === "create") setTrips((items) => [...items, nextTrip]);
    else updateTrip(nextTrip.id, () => nextTrip);
    setActiveTripId(nextTrip.id);
    setActiveDayId(nextTrip.days[0].id);
    setView("plan");
    setToast(tripEditor.mode === "create" ? `Đã tạo ${nextTrip.title}` : "Đã lưu thông tin chuyến đi");
    return { ok: true };
  };

  const toggleHotelShortlist = (hotel: HotelResult) => {
    updateActiveTrip((trip) => ({ ...trip, hotelShortlist: trip.hotelShortlist.some((item) => item.id === hotel.id) ? trip.hotelShortlist.filter((item) => item.id !== hotel.id) : [...trip.hotelShortlist, hotel] }));
  };

  const scheduleHotel = (hotel: HotelResult, input: HotelScheduleInput): string | null => {
    const targetTrip = trips.find((trip) => trip.id === input.tripId);
    const targetDay = targetTrip?.days.find((day) => day.id === input.dayId);
    if (!targetTrip || !targetDay) return "Hãy chọn một chuyến đi và ngày hợp lệ.";
    const id = `hotel-${hotel.id}`;
    if (targetTrip.days.some((day) => day.places.some((place) => place.id === id))) return `Khách sạn này đã có trong ${targetTrip.title}.`;
    const place: Place = {
      id,
      title: `Nhận phòng ${hotel.name}`,
      subtitle: hotel.address,
      type: "hotel",
      time: normalizeTime24(input.time, "14:00"),
      duration: "45 phút",
      note: `${hotel.reason}. Giá tham khảo khi tìm: ${hotel.pricePerNight.toLocaleString("vi-VN")}₫/đêm.`,
      image: hotel.image,
      location: hotel.location,
    };
    updateTrip(targetTrip.id, (trip) => ({
      ...trip,
      days: trip.days.map((day) => day.id === targetDay.id ? { ...day, places: [...day.places, place].sort((a, b) => compareTime24(a.time, b.time)) } : day),
      hotelShortlist: trip.hotelShortlist.some((item) => item.id === hotel.id) ? trip.hotelShortlist : [...trip.hotelShortlist, hotel],
    }));
    setActiveTripId(targetTrip.id);
    setActiveDayId(targetDay.id);
    setView("plan");
    setToast(`Đã thêm khách sạn vào ${targetTrip.title} · ${targetDay.label}`);
    return null;
  };

  const exportTrip = () => {
    if (!activeTrip) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(activeTrip, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTrip.title.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/gi, "-").replace(/^-|-$/g, "") || "chuyen-di"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast(`Đã xuất ${activeTrip.title}`);
  };

  const signOut = async () => {
    await getSupabaseClient()?.auth.signOut();
    setAccountOpen(false);
  };

  if (authState === "loading") return <main className="app-loading"><span className="brand-mark"><MapPin size={21} fill="currentColor" /></span><strong>Đang mở không gian riêng tư…</strong></main>;
  if (authState === "signed-out") return <PrivateLogin />;
  if (!hydrated || !activeTrip || !activeDay) return <main className="app-loading"><span className="brand-mark"><MapPin size={21} fill="currentColor" /></span><strong>Đang tải các chuyến đi của bạn…</strong></main>;

  const displayName = userEmail ? userEmail.split("@")[0] : "Khách du lịch";
  const displayInitial = displayName.slice(0, 1).toUpperCase() || "Đ";
  const today = todayIso();
  const tripStatus = activeTrip.startDate > today ? "Chuyến đi sắp tới" : activeTrip.endDate < today ? "Chuyến đi đã qua" : "Chuyến đi hiện tại";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><MapPin size={19} fill="currentColor" /></div>
          <div><strong>Đi Đâu Đây</strong><span>Trip planner</span></div>
          <IconButton label="Đóng menu" onClick={() => setMobileMenu(false)}><X size={19} /></IconButton>
        </div>
        <nav className="side-nav" aria-label="Điều hướng chính">
          <p className="nav-caption">Chuyến đi</p>
          {NAV_ITEMS.map((item) => {
            const NavIcon = item.icon;
            return <button type="button" key={item.id} className={view === item.id ? "active" : ""} onClick={() => selectView(item.id)}><NavIcon size={19} /><span>{item.label}</span>{item.id === "today" ? <span className="new-dot" /> : null}</button>;
          })}
        </nav>
        <div className="sidebar-trip-card">
          <img src={tripImage} alt="" /><div className="sidebar-trip-card-overlay" />
          <div className="sidebar-trip-card-copy"><span>Chuyến đang chọn</span><strong>{activeTrip.title}</strong><p>{activeTrip.dateRange}</p></div>
          <button type="button" aria-label="Chỉnh sửa chuyến đi" onClick={openEditTrip}><Pencil size={15} /></button>
        </div>
        <div className="profile-row"><div className="avatar">{displayInitial}</div><div><strong>{displayName}</strong><span><LockKeyhole size={12} /> {authState === "demo" ? "Bản thử trên máy" : "Chỉ mình tôi"}</span></div><MoreHorizontal size={18} /></div>
      </aside>
      {mobileMenu ? <button className="sidebar-scrim" aria-label="Đóng menu" onClick={() => setMobileMenu(false)} /> : null}

      <main className="main-stage">
        <header className="topbar">
          <div className="mobile-brand"><IconButton label="Mở menu" onClick={() => setMobileMenu(true)}><Menu size={20} /></IconButton><div className="brand-mark"><MapPin size={17} fill="currentColor" /></div></div>
          <div className="breadcrumb"><span>Chuyến đi của tôi</span><span>/</span><strong>{activeTrip.title}</strong></div>
          <div className="topbar-actions">
            <span className={`save-status ${saveState}`} title={saveState === "error" ? "Không thể lưu" : "Tự động lưu"}>{saveState === "saving" ? <Cloud size={14} /> : saveState === "error" ? <WifiOff size={14} /> : <Save size={14} />}{saveState === "saving" ? "Đang lưu" : saveState === "error" ? "Lỗi lưu" : "Đã lưu"}</span>
            <button className="private-pill" type="button"><LockKeyhole size={14} /> {authState === "demo" ? "Demo cục bộ" : "Riêng tư"}</button>
            <button className="avatar compact" type="button" aria-label="Mở tài khoản" onClick={() => setAccountOpen((current) => !current)}>{displayInitial}</button>
            {accountOpen ? <div className="account-popover"><strong>{displayName}</strong><span>{userEmail || "Dữ liệu đang lưu trên thiết bị này"}</span><button type="button" onClick={exportTrip}><Download size={15} /> Xuất chuyến đang chọn</button>{authState !== "demo" ? <button type="button" onClick={signOut}><LogOut size={15} /> Đăng xuất</button> : null}</div> : null}
          </div>
        </header>

        <div className="content-wrap">
          <section className="trip-picker-bar" aria-label="Danh sách chuyến đi">
            <div className="trip-picker-heading"><span>Các chuyến đi</span><strong>{trips.length} kế hoạch độc lập</strong></div>
            <div className="trip-picker-list">
              {trips.map((trip, index) => <button type="button" key={trip.id} className={trip.id === activeTrip.id ? "active" : ""} onClick={() => selectTrip(trip.id)}><span>Chuyến {index + 1}</span><strong>{trip.title}</strong><small>{trip.dateRange}</small></button>)}
              <button type="button" className="create-trip-button" onClick={openCreateTrip}><Plus size={18} /><strong>Tạo chuyến mới</strong><small>Lịch trình riêng</small></button>
            </div>
          </section>

          <section className="trip-hero">
            <div><span className="eyebrow"><Sparkles size={14} /> {tripStatus}</span><h1>{activeTrip.title}</h1><div className="trip-meta"><span><CalendarDays size={16} /> {activeTrip.dateRange}</span><span><Users size={16} /> {activeTrip.travelers} người</span><span><MapPin size={16} /> {placeCount} địa điểm</span></div></div>
            <div className="hero-actions"><button type="button" className="secondary-button" onClick={openEditTrip}><Pencil size={16} /> Sửa tên & ngày</button><button type="button" className="secondary-button export-trip-button" onClick={exportTrip}><Download size={17} /> Xuất lịch</button><button type="button" className="primary-button" onClick={() => setShowPlaceForm(true)}><Plus size={17} /> Thêm địa điểm</button></div>
          </section>

          <section className="day-tabs" aria-label="Chọn ngày">
            {days.map((day) => <button type="button" key={day.id} onClick={() => setActiveDayId(day.id)} className={day.id === activeDay.id ? "active" : ""}><span>{day.label}</span><strong>{day.shortDate}</strong></button>)}
            <button type="button" className="add-day" aria-label="Thêm một ngày vào cuối chuyến đi" title="Thêm một ngày vào cuối chuyến đi" onClick={addDay}><Plus size={18} /></button>
          </section>

          {view === "plan" ? (
            <section className="plan-view">
              <div className="section-heading"><div><span>{activeTrip.title} · {activeDay.label}</span><h2>{activeDay.date}</h2></div><div className="section-heading-actions"><button type="button" className="small-button" onClick={openDayRoute}><Map size={15} /> Xem tuyến đường</button><button type="button" className="small-button" onClick={openEditTrip}><CalendarDays size={15} /> Đổi ngày chuyến</button></div></div>
              <div className="day-summary">
                <div><span className="summary-icon green"><MapPin size={16} /></span><p><strong>{activeDay.places.length} điểm đến</strong><span>Đã xếp lịch</span></p></div>
                <div><span className="summary-icon orange"><Clock3 size={16} /></span><p><strong>{Math.max(activeDay.places.length * 2, 1)} giờ dự kiến</strong><span>Tổng thời gian</span></p></div>
                <div><span className="summary-icon blue"><Navigation size={16} /></span><p><strong>Mở Google Maps</strong><span>Tuyến đường thực tế</span></p></div>
              </div>
              <div className="timeline-grid">
                <div className="timeline-rail" aria-hidden="true" />
                {activeDay.places.map((place, index) => <div className="timeline-row" key={place.id}><div className="timeline-time"><strong>{place.time}</strong><span>{index === 0 ? "Bắt đầu" : "+ di chuyển"}</span></div><div className={`timeline-marker ${TYPE_META[place.type].className}`}><span /></div><PlaceCard place={place} onToggle={toggleVisited} onSave={toggleSaved} onOpen={() => setSelectedPlace({ dayId: activeDay.id, place })} /></div>)}
                {!activeDay.places.length ? <div className="empty-day"><MapPin size={24} /><strong>Ngày này đang trống</strong><span>Thêm nơi đầu tiên vào {activeTrip.title}.</span></div> : null}
                <button type="button" className="timeline-add" onClick={() => setShowPlaceForm(true)}><Plus size={17} /> Thêm điểm đến vào {activeDay.label.toLowerCase()}</button>
              </div>
            </section>
          ) : null}

          {view === "today" ? (
            <section className="today-view">
              <div className="today-banner"><span className="live-pill"><span /> {activeDay.dateISO === today ? "Lịch hôm nay" : "Ngày đang chọn"}</span><h2>{activeTrip.title}</h2><p>{activeDay.label} · {activeDay.date}. Có {activeDay.places.length} điểm trong kế hoạch.</p></div>
              {activeDay.places[0] ? <div className="next-stop-card"><img src={activeDay.places[0].image} alt="" /><div className="next-stop-overlay" /><div className="next-stop-copy"><span>Điểm tiếp theo · {activeDay.places[0].time}</span><h3>{activeDay.places[0].title}</h3><p><MapPin size={15} /> {activeDay.places[0].subtitle}</p><div><button className="navigate-button" type="button" onClick={() => goToGoogleMaps(activeDay.places[0])}><Navigation size={17} /> Chỉ đường</button><button className="glass-button" type="button" onClick={() => toggleVisited(activeDay.places[0].id)}><Check size={17} /> Đã đến</button></div></div></div> : <div className="empty-day standalone"><MapPin size={24} /><strong>Chưa có lịch cho {activeDay.label.toLowerCase()}</strong></div>}
              <div className="today-list"><div className="section-heading"><div><span>{activeTrip.title}</span><h2>Các điểm sau đó</h2></div></div>{activeDay.places.slice(1).map((place) => <PlaceCard key={place.id} place={place} compact onToggle={toggleVisited} onSave={toggleSaved} onOpen={() => setSelectedPlace({ dayId: activeDay.id, place })} />)}</div>
            </section>
          ) : null}

          {view === "discover" ? <HotelFinder key={activeTrip.id} shortlist={activeTrip.hotelShortlist} initialSearch={hotelSearchInitial} onShortlistChange={toggleHotelShortlist} onConfirmHotel={setPendingHotel} /> : null}

          {view === "map" ? <section className="empty-feature-view map-preview"><div className="map-paper" aria-hidden="true"><span className="road road-a" /><span className="road road-b" /><span className="road road-c" />{activeDay.places.slice(0, 3).map((place, index) => <span key={place.id} className={`map-pin pin-${index + 1}`}>{index + 1}</span>)}</div><div className="map-preview-copy"><span className="eyebrow">{activeTrip.title}</span><h2>{activeDay.places.length} điểm trong {activeDay.label.toLowerCase()}</h2><p>Xem nhanh thứ tự, sau đó mở lộ trình thật trên Google Maps.</p><button className="primary-button" type="button" onClick={openDayRoute} disabled={!activeDay.places.length}><Navigation size={17} /> Mở Google Maps</button></div></section> : null}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Điều hướng di động">
        {NAV_ITEMS.map((item) => { const NavIcon = item.icon; return <button type="button" key={item.id} className={view === item.id ? "active" : ""} onClick={() => selectView(item.id)}><NavIcon size={20} /><span>{item.mobileLabel}</span></button>; })}
        <button type="button" className="mobile-add" aria-label="Thêm địa điểm" onClick={() => setShowPlaceForm(true)}><Plus size={22} /></button>
      </nav>

      {(showPlaceForm || editingPlace) ? <AddPlaceModal days={days} defaultDayId={editingPlace?.dayId ?? activeDay.id} initialPlace={editingPlace?.place} onClose={() => { setShowPlaceForm(false); setEditingPlace(null); }} onAdd={savePlace} /> : null}

      {selectedPlace ? <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPlace(null); }}><section className="modal-card place-detail-modal" role="dialog" aria-modal="true"><div className="place-detail-image"><img src={selectedPlace.place.image} alt="" /><button type="button" className="icon-button" aria-label="Đóng" onClick={() => setSelectedPlace(null)}><X size={18} /></button><span className={`place-type-pill ${TYPE_META[selectedPlace.place.type].className}`}>{TYPE_META[selectedPlace.place.type].label}</span></div><div className="place-detail-content"><span className="eyebrow">{selectedPlace.place.time} · {selectedPlace.place.duration}</span><h2>{selectedPlace.place.title}</h2><p className="address-line"><MapPin size={15} /> {selectedPlace.place.subtitle}</p>{selectedPlace.place.note ? <p className="place-detail-note">“{selectedPlace.place.note}”</p> : null}<div className="place-detail-actions"><button type="button" className="secondary-button danger-button" onClick={() => deletePlace(selectedPlace)}><Trash2 size={16} /> Xóa</button><button type="button" className="secondary-button" onClick={() => { setEditingPlace(selectedPlace); setSelectedPlace(null); }}><Pencil size={16} /> Chỉnh sửa</button><button type="button" className="primary-button" onClick={() => goToGoogleMaps(selectedPlace.place)}><Navigation size={16} /> Chỉ đường</button></div></div></section></div> : null}

      {tripEditor ? <TripSettingsModal mode={tripEditor.mode} trip={tripEditor.trip} onClose={() => setTripEditor(null)} onSave={saveTripSettings} /> : null}
      {pendingHotel ? <ScheduleHotelModal hotel={pendingHotel} trips={trips} defaultTripId={activeTrip.id} onClose={() => setPendingHotel(null)} onConfirm={(input) => scheduleHotel(pendingHotel, input)} /> : null}
      {toast ? <div className="toast"><Check size={16} /> {toast}</div> : null}
    </div>
  );
}
