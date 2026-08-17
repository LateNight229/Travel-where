import type { HotelResult } from "./hotel-provider";

export type PlaceType = "hotel" | "food" | "checkin" | "coffee";

export type Place = {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  type: PlaceType;
  image: string;
  duration: string;
  note?: string;
  visited?: boolean;
  saved?: boolean;
  estimatedCost?: number;
  location: { lat: number; lng: number };
};

export type TripDay = {
  id: string;
  label: string;
  dateISO: string;
  date: string;
  shortDate: string;
  places: Place[];
};

export type TripDocument = {
  id: string;
  position: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  dateRange: string;
  travelers: number;
  updatedAt: string;
  days: TripDay[];
  hotelShortlist: HotelResult[];
};

export type TripSettingsInput = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
};

export type NewPlaceInput = {
  dayId: string;
  title: string;
  subtitle: string;
  type: PlaceType;
  time: string;
  duration: string;
  note: string;
  image: string;
  imageFile?: File;
};
