interface Env {
  SERPAPI_KEY: string;
  ALLOWED_ORIGIN?: string;
}

type SearchInput = {
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

type UnknownRecord = Record<string, unknown>;

function cors(origin: string | null, env: Env): HeadersInit {
  const allowed = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": allowed === "*" || origin === allowed ? (origin || "*") : allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(payload: unknown, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify(payload), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

function numberValue(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return 0;
}

function textValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeArray(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter((item): item is UnknownRecord => Boolean(item) && typeof item === "object") : [];
}

function validateInput(value: unknown): SearchInput {
  if (!value || typeof value !== "object") throw new Error("Yêu cầu tìm kiếm không hợp lệ.");
  const input = value as Partial<SearchInput>;
  if (!input.destination || !input.checkIn || !input.checkOut) throw new Error("Thiếu điểm đến hoặc ngày lưu trú.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.checkOut)) throw new Error("Ngày lưu trú không hợp lệ.");
  if (input.checkIn >= input.checkOut) throw new Error("Ngày trả phòng phải sau ngày nhận phòng.");
  return {
    destination: String(input.destination).slice(0, 100),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: Math.min(Math.max(Number(input.adults) || 2, 1), 8),
    children: Math.min(Math.max(Number(input.children) || 0, 0), 6),
    minPrice: Math.max(Number(input.minPrice) || 0, 0),
    maxPrice: Math.max(Number(input.maxPrice) || 100000000, 0),
    rating: Math.min(Math.max(Number(input.rating) || 0, 0), 5),
    hotelClass: Array.isArray(input.hotelClass) ? input.hotelClass.map(Number).filter((item) => item >= 1 && item <= 5) : [],
    freeCancellation: Boolean(input.freeCancellation),
    sort: input.sort === "price" || input.sort === "rating" ? input.sort : "value",
  };
}

function scoreHotel(price: number, rating: number, reviews: number, freeCancellation: boolean, minPrice: number, maxPrice: number): number {
  const span = Math.max(maxPrice - minPrice, 1);
  const priceScore = 1 - Math.min(Math.max((price - minPrice) / span, 0), 1);
  const reviewConfidence = Math.min(Math.log10(Math.max(reviews, 1)) / 4, 1);
  return Math.round(Math.min(99, 52 + priceScore * 22 + (rating / 5) * 15 + reviewConfidence * 6 + (freeCancellation ? 4 : 0)));
}

function normalizeProperty(property: UnknownRecord, input: SearchInput, index: number) {
  const rate = (property.rate_per_night as UnknownRecord | undefined) || {};
  const totalRate = (property.total_rate as UnknownRecord | undefined) || {};
  const prices = safeArray(property.prices);
  const firstPrice = prices[0] || {};
  const firstRate = (firstPrice.rate_per_night as UnknownRecord | undefined) || {};
  const firstTotal = (firstPrice.total_rate as UnknownRecord | undefined) || {};
  const pricePerNight = numberValue(rate.extracted_lowest, rate.lowest, firstRate.extracted_lowest, firstRate.lowest);
  const totalPrice = numberValue(totalRate.extracted_lowest, totalRate.lowest, firstTotal.extracted_lowest, firstTotal.lowest, pricePerNight);
  const rating = numberValue(property.overall_rating, property.rating);
  const reviews = numberValue(property.reviews);
  const hotelClass = Math.round(numberValue(property.extracted_hotel_class, property.hotel_class)) || 3;
  const images = safeArray(property.images).map((image) => textValue(image.original_image, textValue(image.thumbnail))).filter(Boolean).slice(0, 5);
  const amenities = Array.isArray(property.amenities) ? property.amenities.filter((item): item is string => typeof item === "string").slice(0, 8) : [];
  const cancellationText = JSON.stringify(property).toLowerCase();
  const freeCancellation = cancellationText.includes("free cancellation") || cancellationText.includes("hủy miễn phí");
  const gps = (property.gps_coordinates as UnknownRecord | undefined) || {};
  const name = textValue(property.name, `Khách sạn ${index + 1}`);
  const source = textValue(firstPrice.source, "Google Hotels");
  const valueScore = scoreHotel(pricePerNight, rating, reviews, freeCancellation, input.minPrice, input.maxPrice);
  const reasonParts = [rating >= 4.5 ? `Điểm ${rating.toFixed(1)}` : "", reviews >= 500 ? `${reviews.toLocaleString("vi-VN")} đánh giá` : "", freeCancellation ? "có hủy miễn phí" : "", valueScore >= 90 ? "giá tốt trong tầm tiền" : ""].filter(Boolean);
  return {
    id: textValue(property.property_token, `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`),
    name,
    image: images[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=82",
    images,
    address: textValue(property.address, textValue(property.description, input.destination)),
    rating,
    reviews,
    hotelClass,
    pricePerNight,
    totalPrice,
    beforeTaxes: numberValue(rate.extracted_before_taxes_fees, firstRate.extracted_before_taxes_fees),
    currency: "VND",
    amenities,
    freeCancellation,
    source,
    link: textValue(property.link, `https://www.google.com/travel/search?q=${encodeURIComponent(`${name} ${input.destination}`)}`),
    location: { lat: numberValue(gps.latitude), lng: numberValue(gps.longitude) },
    valueScore,
    reason: reasonParts.join(", ") || "Phù hợp khoảng giá và tiêu chí đã chọn",
    fetchedAt: new Date().toISOString(),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const headers = cors(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST" || new URL(request.url).pathname !== "/search") return json({ error: "Not found" }, 404, headers);
    if (env.ALLOWED_ORIGIN && origin && origin !== env.ALLOWED_ORIGIN) return json({ error: "Origin không được phép." }, 403, headers);
    if (!env.SERPAPI_KEY) return json({ error: "Server chưa có SERPAPI_KEY." }, 500, headers);

    try {
      const input = validateInput(await request.json());
      const params = new URLSearchParams({
        engine: "google_hotels",
        q: input.destination,
        check_in_date: input.checkIn,
        check_out_date: input.checkOut,
        adults: String(input.adults),
        children: String(input.children),
        currency: "VND",
        gl: "vn",
        hl: "vi",
        api_key: env.SERPAPI_KEY,
      });
      const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
      const payload = await response.json() as UnknownRecord;
      if (!response.ok || payload.error) throw new Error(textValue(payload.error, "SerpAPI không trả về kết quả."));
      let hotels = safeArray(payload.properties).map((property, index) => normalizeProperty(property, input, index));
      hotels = hotels.filter((hotel) => hotel.pricePerNight > 0 && hotel.pricePerNight >= input.minPrice && hotel.pricePerNight <= input.maxPrice && hotel.rating >= input.rating && (!input.hotelClass.length || input.hotelClass.includes(hotel.hotelClass)) && (!input.freeCancellation || hotel.freeCancellation));
      hotels.sort((a, b) => input.sort === "price" ? a.pricePerNight - b.pricePerNight : input.sort === "rating" ? b.rating - a.rating : b.valueScore - a.valueScore);
      return json({ hotels: hotels.slice(0, 40), meta: { source: "SerpAPI Google Hotels", count: hotels.length } }, 200, headers);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Không thể tìm khách sạn." }, 400, headers);
    }
  },
};
