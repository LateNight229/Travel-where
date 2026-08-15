"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import {
  BedDouble,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
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
import { appConfig } from "../lib/app-config";
import type { HotelResult } from "../lib/hotel-provider";
import { getSupabaseClient, loadLatestTripDocument, saveTripDocument, uploadTripPhoto } from "../lib/supabase-client";
import type { NewPlaceInput, Place, PlaceType, TripDay, TripDocument } from "../lib/trip-types";

type View = "plan" | "discover" | "map" | "today";
type AuthState = "loading" | "signed-out" | "signed-in" | "demo";
type SaveState = "idle" | "saving" | "saved" | "error";

const DEFAULT_DAYS: TripDay[] = [
  {
    id: "day-1",
    label: "Ngày 1",
    date: "Thứ Sáu, 16 tháng 10",
    shortDate: "16/10",
    places: [
      {
        id: "sala",
        time: "14:00",
        title: "Nhận phòng Sala Danang Beach",
        subtitle: "36–38 Lâm Hoành, Sơn Trà",
        type: "hotel",
        duration: "45 phút",
        note: "Nhờ phòng tầng cao, hướng biển nếu còn.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=84",
        location: { lat: 16.0588, lng: 108.2441 },
      },
      {
        id: "beach",
        time: "16:30",
        title: "Dạo biển Mỹ Khê",
        subtitle: "Bãi biển Mỹ Khê, Đà Nẵng",
        type: "checkin",
        duration: "1 giờ 30 phút",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=84",
        location: { lat: 16.0544, lng: 108.2461 },
      },
      {
        id: "seafood",
        time: "19:00",
        title: "Hải sản Bé Mặn",
        subtitle: "Lô 14 Hoàng Sa, Mân Thái",
        type: "food",
        duration: "1 giờ 30 phút",
        note: "Gọi trước bàn sát biển. Thử tôm tít rang muối.",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=84",
        location: { lat: 16.0835, lng: 108.2472 },
      },
    ],
  },
  {
    id: "day-2",
    label: "Ngày 2",
    date: "Thứ Bảy, 17 tháng 10",
    shortDate: "17/10",
    places: [
      {
        id: "marble",
        time: "08:00",
        title: "Ngũ Hành Sơn",
        subtitle: "81 Huyền Trân Công Chúa",
        type: "checkin",
        duration: "2 giờ",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=84",
        location: { lat: 16.0034, lng: 108.2641 },
      },
      {
        id: "banh-mi",
        time: "11:30",
        title: "Bánh mì Phượng",
        subtitle: "2B Phan Châu Trinh, Hội An",
        type: "food",
        duration: "45 phút",
        image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=84",
        location: { lat: 15.8803, lng: 108.3273 },
      },
      {
        id: "hoian",
        time: "15:30",
        title: "Phố cổ Hội An",
        subtitle: "Chùa Cầu → bờ sông Hoài",
        type: "checkin",
        duration: "4 giờ",
        note: "Ở lại đến lúc phố lên đèn. Mang pin dự phòng.",
        image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=84",
        location: { lat: 15.8771, lng: 108.3265 },
      },
    ],
  },
  {
    id: "day-3",
    label: "Ngày 3",
    date: "Chủ Nhật, 18 tháng 10",
    shortDate: "18/10",
    places: [
      {
        id: "sontra",
        time: "07:30",
        title: "Bán đảo Sơn Trà",
        subtitle: "Chùa Linh Ứng, Sơn Trà",
        type: "checkin",
        duration: "2 giờ 30 phút",
        image: "https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1200&q=84",
        location: { lat: 16.1002, lng: 108.2779 },
      },
      {
        id: "factory-coffee",
        time: "14:00",
        title: "43 Factory Coffee Roaster",
        subtitle: "422 Ngô Thì Sĩ, Mỹ An",
        type: "coffee",
        duration: "1 giờ",
        image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=84",
        location: { lat: 16.0401, lng: 108.2463 },
      },
    ],
  },
];

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

const DEMO_CACHE_KEY = "di-dau-day-trip-v1";

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

function readDocument(value: unknown): Partial<TripDocument> | null {
  if (!value || typeof value !== "object") return null;
  return value as Partial<TripDocument>;
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

export default function TripPlannerApp() {
  const [view, setView] = useState<View>("plan");
  const [activeDayId, setActiveDayId] = useState("day-2");
  const [days, setDays] = useState<TripDay[]>(DEFAULT_DAYS);
  const [hotelShortlist, setHotelShortlist] = useState<HotelResult[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ dayId: string; place: Place } | null>(null);
  const [editingPlace, setEditingPlace] = useState<{ dayId: string; place: Place } | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(appConfig.demoMode ? "demo" : "loading");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [tripId, setTripId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [toast, setToast] = useState("");

  const activeDay = useMemo(() => days.find((day) => day.id === activeDayId) ?? days[0], [activeDayId, days]);
  const placeCount = useMemo(() => days.reduce((total, day) => total + day.places.length, 0), [days]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (appConfig.demoMode) {
      try {
        const cached = window.localStorage.getItem(DEMO_CACHE_KEY);
        const document = cached ? readDocument(JSON.parse(cached)) : null;
        if (document?.days?.length) {
          setDays(document.days);
          setActiveDayId(document.days[0].id);
        }
        if (Array.isArray(document?.hotelShortlist)) setHotelShortlist(document.hotelShortlist);
      } catch {
        window.localStorage.removeItem(DEMO_CACHE_KEY);
      }
      setTripId("demo-trip");
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
      if (!user) setHydrated(false);
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
    loadLatestTripDocument(userId)
      .then((latest) => {
        if (!mounted) return;
        const document = readDocument(latest?.document);
        if (document?.days?.length) {
          setDays(document.days);
          setActiveDayId(document.days[0].id);
        }
        if (Array.isArray(document?.hotelShortlist)) setHotelShortlist(document.hotelShortlist);
        setTripId(latest?.tripId ?? crypto.randomUUID());
      })
      .catch(() => {
        if (mounted) {
          setTripId(crypto.randomUUID());
          setSaveState("error");
        }
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    if (!hydrated || !tripId) return;
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      const tripDocument: TripDocument = {
        id: tripId,
        title: "Đà Nẵng · Hội An",
        destination: "Đà Nẵng, Hội An",
        dateRange: "16–19 tháng 10, 2026",
        travelers: 2,
        updatedAt: new Date().toISOString(),
        days,
        hotelShortlist,
      };
      try {
        if (appConfig.demoMode) window.localStorage.setItem(DEMO_CACHE_KEY, JSON.stringify(tripDocument));
        else if (userId) await saveTripDocument(userId, tripId, tripDocument);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 850);
    return () => window.clearTimeout(timer);
  }, [days, hotelShortlist, hydrated, tripId, userId]);

  const updatePlace = (placeId: string, updater: (place: Place) => Place) => {
    setDays((current) => current.map((day) => ({ ...day, places: day.places.map((place) => place.id === placeId ? updater(place) : place) })));
  };

  const toggleVisited = (placeId: string) => updatePlace(placeId, (place) => ({ ...place, visited: !place.visited }));
  const toggleSaved = (placeId: string) => updatePlace(placeId, (place) => ({ ...place, saved: !place.saved }));

  const goToGoogleMaps = (place: Place) => {
    const query = encodeURIComponent(`${place.location.lat},${place.location.lng}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  const openDayRoute = () => {
    if (!activeDay.places.length) return;
    if (activeDay.places.length === 1) return goToGoogleMaps(activeDay.places[0]);
    const coordinates = activeDay.places.map((place) => `${place.location.lat},${place.location.lng}`);
    const origin = encodeURIComponent(coordinates[0]);
    const destination = encodeURIComponent(coordinates[coordinates.length - 1]);
    const waypoints = coordinates.slice(1, -1).map(encodeURIComponent).join("%7C");
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=driving`, "_blank", "noopener,noreferrer");
  };

  const savePlace = async (input: NewPlaceInput) => {
    let image = input.image;
    if (input.imageFile) image = appConfig.demoMode ? await imageToDataUrl(input.imageFile) : await uploadTripPhoto(userId, tripId, input.imageFile);
    if (editingPlace) {
      const changedDay = editingPlace.dayId !== input.dayId;
      const updated: Place = { ...editingPlace.place, title: input.title, subtitle: input.subtitle, type: input.type, time: input.time, duration: input.duration, note: input.note, image };
      if (changedDay) {
        setDays((current) => current.map((day) => {
          if (day.id === editingPlace.dayId) return { ...day, places: day.places.filter((place) => place.id !== editingPlace.place.id) };
          if (day.id === input.dayId) return { ...day, places: [...day.places, updated].sort((a, b) => a.time.localeCompare(b.time)) };
          return day;
        }));
      } else updatePlace(editingPlace.place.id, () => updated);
      setToast("Đã cập nhật địa điểm");
      setEditingPlace(null);
      return;
    }
    const place: Place = {
      id: crypto.randomUUID(),
      title: input.title,
      subtitle: input.subtitle,
      type: input.type,
      time: input.time,
      duration: input.duration,
      note: input.note,
      image,
      location: { lat: 16.0544, lng: 108.2461 },
    };
    setDays((current) => current.map((day) => day.id === input.dayId ? { ...day, places: [...day.places, place].sort((a, b) => a.time.localeCompare(b.time)) } : day));
    setActiveDayId(input.dayId);
    setToast("Đã thêm địa điểm vào lịch trình");
  };

  const deletePlace = (target: { dayId: string; place: Place }) => {
    if (!window.confirm(`Xóa “${target.place.title}” khỏi lịch trình?`)) return;
    setDays((current) => current.map((day) => day.id === target.dayId ? { ...day, places: day.places.filter((place) => place.id !== target.place.id) } : day));
    setSelectedPlace(null);
    setToast("Đã xóa địa điểm");
  };

  const addDay = () => {
    const number = days.length + 1;
    const id = crypto.randomUUID();
    setDays((current) => [...current, { id, label: `Ngày ${number}`, date: `Ngày ${number} của chuyến đi`, shortDate: "--/--", places: [] }]);
    setActiveDayId(id);
    setView("plan");
    setToast("Đã thêm một ngày mới");
  };

  const toggleHotelShortlist = (hotel: HotelResult) => {
    setHotelShortlist((current) => current.some((item) => item.id === hotel.id) ? current.filter((item) => item.id !== hotel.id) : [...current, hotel]);
  };

  const confirmHotel = (hotel: HotelResult) => {
    const targetDayId = activeDayId || days[0].id;
    const id = `hotel-${hotel.id}`;
    if (days.some((day) => day.places.some((place) => place.id === id))) {
      setToast("Khách sạn này đã có trong lịch trình");
      return;
    }
    const place: Place = {
      id,
      title: `Nhận phòng ${hotel.name}`,
      subtitle: hotel.address,
      type: "hotel",
      time: "14:00",
      duration: "45 phút",
      note: `${hotel.reason}. Giá tham khảo khi tìm: ${hotel.pricePerNight.toLocaleString("vi-VN")}₫/đêm.`,
      image: hotel.image,
      location: hotel.location,
    };
    setDays((current) => current.map((day) => day.id === targetDayId ? { ...day, places: [...day.places, place].sort((a, b) => a.time.localeCompare(b.time)) } : day));
    setHotelShortlist((current) => current.some((item) => item.id === hotel.id) ? current : [...current, hotel]);
    setView("plan");
    setToast("Đã thêm khách sạn vào chuyến đi");
  };

  const exportTrip = () => {
    const payload = JSON.stringify({ title: "Đà Nẵng · Hội An", days, hotelShortlist }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "di-dau-day-trip.json";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Đã xuất bản sao JSON");
  };

  const signOut = async () => {
    await getSupabaseClient()?.auth.signOut();
    setAccountOpen(false);
  };

  if (authState === "loading") return <main className="app-loading"><span className="brand-mark"><MapPin size={21} fill="currentColor" /></span><strong>Đang mở chuyến đi riêng tư…</strong></main>;
  if (authState === "signed-out") return <PrivateLogin />;
  if (authState === "signed-in" && !hydrated) return <main className="app-loading"><span className="brand-mark"><MapPin size={21} fill="currentColor" /></span><strong>Đang tải dữ liệu của bạn…</strong></main>;

  const displayName = userEmail ? userEmail.split("@")[0] : "Khách du lịch";
  const displayInitial = displayName.slice(0, 1).toUpperCase() || "Đ";

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
            return <button type="button" key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setMobileMenu(false); }}><NavIcon size={19} /><span>{item.label}</span>{item.id === "today" ? <span className="new-dot" /> : null}</button>;
          })}
        </nav>
        <div className="sidebar-trip-card">
          <img src={DEFAULT_DAYS[1].places[2].image} alt="Phố cổ Hội An" /><div className="sidebar-trip-card-overlay" />
          <div className="sidebar-trip-card-copy"><span>Chuyến hiện tại</span><strong>Đà Nẵng · Hội An</strong><p>16–19 tháng 10, 2026</p></div>
          <button type="button" aria-label="Đổi chuyến đi"><ChevronDown size={17} /></button>
        </div>
        <div className="profile-row"><div className="avatar">{displayInitial}</div><div><strong>{displayName}</strong><span><LockKeyhole size={12} /> {authState === "demo" ? "Bản thử trên máy" : "Chỉ mình tôi"}</span></div><MoreHorizontal size={18} /></div>
      </aside>
      {mobileMenu ? <button className="sidebar-scrim" aria-label="Đóng menu" onClick={() => setMobileMenu(false)} /> : null}

      <main className="main-stage">
        <header className="topbar">
          <div className="mobile-brand"><IconButton label="Mở menu" onClick={() => setMobileMenu(true)}><Menu size={20} /></IconButton><div className="brand-mark"><MapPin size={17} fill="currentColor" /></div></div>
          <div className="breadcrumb"><span>Chuyến đi của tôi</span><span>/</span><strong>Đà Nẵng · Hội An</strong></div>
          <div className="topbar-actions">
            <span className={`save-status ${saveState}`} title={saveState === "error" ? "Không thể lưu" : "Tự động lưu"}>{saveState === "saving" ? <Cloud size={14} /> : saveState === "error" ? <WifiOff size={14} /> : <Save size={14} />}{saveState === "saving" ? "Đang lưu" : saveState === "error" ? "Lỗi lưu" : "Đã lưu"}</span>
            <button className="private-pill" type="button"><LockKeyhole size={14} /> {authState === "demo" ? "Demo cục bộ" : "Riêng tư"}</button>
            <button className="avatar compact" type="button" aria-label="Mở tài khoản" onClick={() => setAccountOpen((current) => !current)}>{displayInitial}</button>
            {accountOpen ? <div className="account-popover"><strong>{displayName}</strong><span>{userEmail || "Dữ liệu đang lưu trên thiết bị này"}</span><button type="button" onClick={exportTrip}><Download size={15} /> Xuất dữ liệu</button>{authState !== "demo" ? <button type="button" onClick={signOut}><LogOut size={15} /> Đăng xuất</button> : null}</div> : null}
          </div>
        </header>

        <div className="content-wrap">
          <section className="trip-hero">
            <div><span className="eyebrow"><Sparkles size={14} /> Chuyến đi sắp tới</span><h1>Đà Nẵng <span>·</span> Hội An</h1><div className="trip-meta"><span><CalendarDays size={16} /> 16–19 tháng 10, 2026</span><span><Users size={16} /> 2 người</span><span><MapPin size={16} /> {placeCount} địa điểm</span></div></div>
            <div className="hero-actions"><button type="button" className="secondary-button" onClick={exportTrip}><Download size={17} /> Xuất lịch</button><button type="button" className="primary-button" onClick={() => setShowPlaceForm(true)}><Plus size={17} /> Thêm địa điểm</button></div>
          </section>

          <section className="day-tabs" aria-label="Chọn ngày">
            {days.map((day) => <button type="button" key={day.id} onClick={() => setActiveDayId(day.id)} className={day.id === activeDay.id ? "active" : ""}><span>{day.label}</span><strong>{day.shortDate}</strong></button>)}
            <button type="button" className="add-day" aria-label="Thêm ngày" onClick={addDay}><Plus size={18} /></button>
          </section>

          {view === "plan" ? (
            <section className="plan-view">
              <div className="section-heading"><div><span>{activeDay.label}</span><h2>{activeDay.date}</h2></div><div className="section-heading-actions"><button type="button" className="small-button" onClick={openDayRoute}><Map size={15} /> Xem tuyến đường</button><IconButton label="Tùy chọn ngày"><MoreHorizontal size={19} /></IconButton></div></div>
              <div className="day-summary">
                <div><span className="summary-icon green"><MapPin size={16} /></span><p><strong>{activeDay.places.length} điểm đến</strong><span>Đã xếp lịch</span></p></div>
                <div><span className="summary-icon orange"><Clock3 size={16} /></span><p><strong>{Math.max(activeDay.places.length * 2, 1)} giờ dự kiến</strong><span>Tổng thời gian</span></p></div>
                <div><span className="summary-icon blue"><Navigation size={16} /></span><p><strong>Mở Google Maps</strong><span>Tuyến đường thực tế</span></p></div>
              </div>
              <div className="timeline-grid">
                <div className="timeline-rail" aria-hidden="true" />
                {activeDay.places.map((place, index) => <div className="timeline-row" key={place.id}><div className="timeline-time"><strong>{place.time}</strong><span>{index === 0 ? "Bắt đầu" : "+ di chuyển"}</span></div><div className={`timeline-marker ${TYPE_META[place.type].className}`}><span /></div><PlaceCard place={place} onToggle={toggleVisited} onSave={toggleSaved} onOpen={() => setSelectedPlace({ dayId: activeDay.id, place })} /></div>)}
                {!activeDay.places.length ? <div className="empty-day"><MapPin size={24} /><strong>Ngày này đang trống</strong><span>Thêm nơi đầu tiên để bắt đầu lên lịch.</span></div> : null}
                <button type="button" className="timeline-add" onClick={() => setShowPlaceForm(true)}><Plus size={17} /> Thêm điểm đến vào ngày này</button>
              </div>
            </section>
          ) : null}

          {view === "today" ? (
            <section className="today-view">
              <div className="today-banner"><span className="live-pill"><span /> Chế độ đang đi</span><h2>Sẵn sàng lên đường!</h2><p>Hôm nay có {activeDay.places.length} điểm. Chạm “Đã đến” để theo dõi tiến độ.</p></div>
              {activeDay.places[0] ? <div className="next-stop-card"><img src={activeDay.places[0].image} alt="" /><div className="next-stop-overlay" /><div className="next-stop-copy"><span>Điểm tiếp theo · {activeDay.places[0].time}</span><h3>{activeDay.places[0].title}</h3><p><MapPin size={15} /> {activeDay.places[0].subtitle}</p><div><button className="navigate-button" type="button" onClick={() => goToGoogleMaps(activeDay.places[0])}><Navigation size={17} /> Chỉ đường</button><button className="glass-button" type="button" onClick={() => toggleVisited(activeDay.places[0].id)}><Check size={17} /> Đã đến</button></div></div></div> : <div className="empty-day standalone"><MapPin size={24} /><strong>Chưa có lịch cho ngày này</strong></div>}
              <div className="today-list"><div className="section-heading"><div><span>Sau đó</span><h2>Lịch hôm nay</h2></div></div>{activeDay.places.slice(1).map((place) => <PlaceCard key={place.id} place={place} compact onToggle={toggleVisited} onSave={toggleSaved} onOpen={() => setSelectedPlace({ dayId: activeDay.id, place })} />)}</div>
            </section>
          ) : null}

          {view === "discover" ? <HotelFinder shortlist={hotelShortlist} onShortlistChange={toggleHotelShortlist} onConfirmHotel={confirmHotel} /> : null}

          {view === "map" ? <section className="empty-feature-view map-preview"><div className="map-paper" aria-hidden="true"><span className="road road-a" /><span className="road road-b" /><span className="road road-c" />{activeDay.places.slice(0, 3).map((place, index) => <span key={place.id} className={`map-pin pin-${index + 1}`}>{index + 1}</span>)}</div><div className="map-preview-copy"><span className="eyebrow">Sơ đồ ngày đi</span><h2>{activeDay.places.length} điểm trong {activeDay.label.toLowerCase()}</h2><p>Xem nhanh thứ tự, sau đó mở lộ trình thật trên Google Maps.</p><button className="primary-button" type="button" onClick={openDayRoute} disabled={!activeDay.places.length}><Navigation size={17} /> Mở Google Maps</button></div></section> : null}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Điều hướng di động">
        {NAV_ITEMS.map((item) => { const NavIcon = item.icon; return <button type="button" key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><NavIcon size={20} /><span>{item.mobileLabel}</span></button>; })}
        <button type="button" className="mobile-add" aria-label="Thêm địa điểm" onClick={() => setShowPlaceForm(true)}><Plus size={22} /></button>
      </nav>

      {(showPlaceForm || editingPlace) ? <AddPlaceModal days={days} defaultDayId={editingPlace?.dayId ?? activeDay.id} initialPlace={editingPlace?.place} onClose={() => { setShowPlaceForm(false); setEditingPlace(null); }} onAdd={savePlace} /> : null}

      {selectedPlace ? <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPlace(null); }}><section className="modal-card place-detail-modal" role="dialog" aria-modal="true"><div className="place-detail-image"><img src={selectedPlace.place.image} alt="" /><button type="button" className="icon-button" aria-label="Đóng" onClick={() => setSelectedPlace(null)}><X size={18} /></button><span className={`place-type-pill ${TYPE_META[selectedPlace.place.type].className}`}>{TYPE_META[selectedPlace.place.type].label}</span></div><div className="place-detail-content"><span className="eyebrow">{selectedPlace.place.time} · {selectedPlace.place.duration}</span><h2>{selectedPlace.place.title}</h2><p className="address-line"><MapPin size={15} /> {selectedPlace.place.subtitle}</p>{selectedPlace.place.note ? <p className="place-detail-note">“{selectedPlace.place.note}”</p> : null}<div className="place-detail-actions"><button type="button" className="secondary-button danger-button" onClick={() => deletePlace(selectedPlace)}><Trash2 size={16} /> Xóa</button><button type="button" className="secondary-button" onClick={() => { setEditingPlace(selectedPlace); setSelectedPlace(null); }}><Pencil size={16} /> Chỉnh sửa</button><button type="button" className="primary-button" onClick={() => goToGoogleMaps(selectedPlace.place)}><Navigation size={16} /> Chỉ đường</button></div></div></section></div> : null}

      {toast ? <div className="toast"><Check size={16} /> {toast}</div> : null}
    </div>
  );
}
