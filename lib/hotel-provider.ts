import { appConfig } from "./app-config";

export type HotelSearchInput = {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  minPrice: number;
  maxPrice: number;
  rating: number;
  hotelClass: number[];
  freeCancellation: boolean;
  sort: "value" | "price" | "rating";
};

export type HotelResult = {
  id: string;
  name: string;
  image: string;
  images: string[];
  address: string;
  rating: number;
  reviews: number;
  hotelClass: number;
  pricePerNight: number;
  totalPrice: number;
  beforeTaxes?: number;
  currency: string;
  amenities: string[];
  freeCancellation: boolean;
  source: string;
  link: string;
  location: { lat: number; lng: number };
  valueScore: number;
  reason: string;
  fetchedAt: string;
};

const IMAGES = {
  beach: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=84",
  room: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=84",
  pool: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=84",
  resort: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=84",
  lobby: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=84",
  balcony: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=84",
};

const DEMO_HOTELS: HotelResult[] = [
  {
    id: "minh-boutique",
    name: "Minh Boutique",
    image: IMAGES.pool,
    images: [IMAGES.pool, IMAGES.room, IMAGES.lobby],
    address: "5 Nguyễn Cao Luyện, Sơn Trà, Đà Nẵng",
    rating: 4.7,
    reviews: 486,
    hotelClass: 4,
    pricePerNight: 980000,
    totalPrice: 2940000,
    currency: "VND",
    amenities: ["Hồ bơi", "Bữa sáng", "Đưa đón sân bay"],
    freeCancellation: true,
    source: "Google Hotels · mẫu",
    link: "https://www.google.com/travel/search?q=Minh%20Boutique%20Da%20Nang",
    location: { lat: 16.0682, lng: 108.2403 },
    valueScore: 94,
    reason: "Rẻ hơn mức trung bình 21%, điểm 4,7 và có hủy miễn phí",
    fetchedAt: new Date().toISOString(),
  },
  {
    id: "haian-beach",
    name: "HAIAN Beach Hotel & Spa",
    image: IMAGES.beach,
    images: [IMAGES.beach, IMAGES.room, IMAGES.pool],
    address: "278 Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng",
    rating: 4.6,
    reviews: 3208,
    hotelClass: 4,
    pricePerNight: 1620000,
    totalPrice: 4860000,
    currency: "VND",
    amenities: ["Sát biển", "Hồ bơi vô cực", "Spa", "Bữa sáng"],
    freeCancellation: true,
    source: "Google Hotels · mẫu",
    link: "https://www.google.com/travel/search?q=HAIAN%20Beach%20Hotel%20Da%20Nang",
    location: { lat: 16.0476, lng: 108.2478 },
    valueScore: 91,
    reason: "Vị trí sát biển, hơn 3.000 đánh giá và hủy miễn phí",
    fetchedAt: new Date().toISOString(),
  },
  {
    id: "stella-maris",
    name: "Stella Maris Beach Danang",
    image: IMAGES.resort,
    images: [IMAGES.resort, IMAGES.balcony, IMAGES.room],
    address: "3 Võ Văn Kiệt, Sơn Trà, Đà Nẵng",
    rating: 4.5,
    reviews: 1784,
    hotelClass: 4,
    pricePerNight: 1350000,
    totalPrice: 4050000,
    currency: "VND",
    amenities: ["Sát biển", "Rooftop", "Hồ bơi", "Gym"],
    freeCancellation: false,
    source: "Google Hotels · mẫu",
    link: "https://www.google.com/travel/search?q=Stella%20Maris%20Beach%20Danang",
    location: { lat: 16.0591, lng: 108.2449 },
    valueScore: 88,
    reason: "Cách biển 2 phút đi bộ, rooftop đẹp và giá cân bằng",
    fetchedAt: new Date().toISOString(),
  },
  {
    id: "le-sands",
    name: "Le Sands Oceanfront Danang Hotel",
    image: IMAGES.balcony,
    images: [IMAGES.balcony, IMAGES.pool, IMAGES.lobby],
    address: "28 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng",
    rating: 4.7,
    reviews: 1168,
    hotelClass: 4,
    pricePerNight: 1480000,
    totalPrice: 4440000,
    currency: "VND",
    amenities: ["View biển", "Hồ bơi", "Bữa sáng", "Phòng gia đình"],
    freeCancellation: true,
    source: "Google Hotels · mẫu",
    link: "https://www.google.com/travel/search?q=Le%20Sands%20Oceanfront%20Danang",
    location: { lat: 16.0796, lng: 108.2479 },
    valueScore: 90,
    reason: "View biển trực diện, điểm 4,7 và phòng rộng",
    fetchedAt: new Date().toISOString(),
  },
  {
    id: "cozy-danang",
    name: "Cozy Danang Boutique Hotel",
    image: IMAGES.lobby,
    images: [IMAGES.lobby, IMAGES.room, IMAGES.pool],
    address: "37 Cô Giang, Hải Châu, Đà Nẵng",
    rating: 4.6,
    reviews: 392,
    hotelClass: 3,
    pricePerNight: 720000,
    totalPrice: 2160000,
    currency: "VND",
    amenities: ["Trung tâm", "Hồ bơi", "Bãi đỗ xe"],
    freeCancellation: true,
    source: "Google Hotels · mẫu",
    link: "https://www.google.com/travel/search?q=Cozy%20Danang%20Boutique%20Hotel",
    location: { lat: 16.058, lng: 108.2177 },
    valueScore: 92,
    reason: "Giá thấp nhất nhóm, gần trung tâm và hủy miễn phí",
    fetchedAt: new Date().toISOString(),
  },
  {
    id: "sala-danang",
    name: "Sala Danang Beach Hotel",
    image: IMAGES.beach,
    images: [IMAGES.beach, IMAGES.pool, IMAGES.room],
    address: "36–38 Lâm Hoành, Sơn Trà, Đà Nẵng",
    rating: 4.6,
    reviews: 3560,
    hotelClass: 4,
    pricePerNight: 1280000,
    totalPrice: 3840000,
    currency: "VND",
    amenities: ["Sát biển", "Hồ bơi vô cực", "Bữa sáng", "Bar"],
    freeCancellation: true,
    source: "Google Hotels · mẫu",
    link: "https://www.google.com/travel/search?q=Sala%20Danang%20Beach%20Hotel",
    location: { lat: 16.0588, lng: 108.2441 },
    valueScore: 93,
    reason: "Giá tốt trong nhóm sát biển, nhiều đánh giá và hồ bơi đẹp",
    fetchedAt: new Date().toISOString(),
  },
];

function sortHotels(hotels: HotelResult[], sort: HotelSearchInput["sort"]): HotelResult[] {
  return [...hotels].sort((a, b) => {
    if (sort === "price") return a.pricePerNight - b.pricePerNight;
    if (sort === "rating") return b.rating - a.rating || b.reviews - a.reviews;
    return b.valueScore - a.valueScore;
  });
}

function demoSearch(input: HotelSearchInput): HotelResult[] {
  const filtered = DEMO_HOTELS.filter((hotel) =>
    hotel.pricePerNight >= input.minPrice &&
    hotel.pricePerNight <= input.maxPrice &&
    hotel.rating >= input.rating &&
    (!input.hotelClass.length || input.hotelClass.includes(hotel.hotelClass)) &&
    (!input.freeCancellation || hotel.freeCancellation),
  );
  return sortHotels(filtered.length ? filtered : DEMO_HOTELS, input.sort);
}

export async function searchHotels(input: HotelSearchInput): Promise<{ hotels: HotelResult[]; mode: "live" | "demo" }> {
  if (!appConfig.hotelApiUrl) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { hotels: demoSearch(input), mode: "demo" };
  }

  const response = await fetch(appConfig.hotelApiUrl.replace(/\/$/, "") + "/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Không thể tải giá khách sạn. Hãy thử lại sau.");
  const payload = (await response.json()) as { hotels?: HotelResult[] };
  return { hotels: sortHotels(payload.hotels ?? [], input.sort), mode: "live" };
}

export function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}
