// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  phone: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_checkin: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_url: string | null;
  base_currency: string;
  trip_currency: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TripMember {
  trip_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profile?: Profile;
}

export type ActivityCategory =
  | "transport"
  | "food"
  | "attraction"
  | "accommodation"
  | "shopping"
  | "other";

export interface Schedule {
  id: string;
  trip_id: string;
  title: string;
  description: string | null;
  category: ActivityCategory;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  place_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  naver_place_id: string | null;
  kakao_place_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory =
  | "food"
  | "transport"
  | "accommodation"
  | "shopping"
  | "entertainment"
  | "health"
  | "other";

export interface Expense {
  id: string;
  trip_id: string;
  schedule_id: string | null;
  title: string;
  category: ExpenseCategory;
  amount_krw: number;
  amount_myr: number | null;
  exchange_rate: number | null;
  paid_by: string;
  receipt_url: string | null;
  notes: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
  // joined
  paid_by_profile?: Profile;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  share_krw: number;
  share_myr: number | null;
  is_settled: boolean;
  settled_at: string | null;
  profile?: Profile;
}

export interface Checkin {
  id: string;
  trip_id: string;
  user_id: string;
  lat: number;
  lng: number;
  place_name: string | null;
  note: string | null;
  created_at: string;
  profile?: Profile;
}

// ─── Derived / UI Types ───────────────────────────────────────────────────────

export interface DebtEntry {
  debtorId: string;
  creditorId: string;
  amountKrw: number;
  amountMyr: number;
  debtor?: Profile;
  creditor?: Profile;
}

export interface TripTotals {
  trip_id: string;
  expense_count: number;
  total_krw: number;
  total_myr: number;
}

export interface WeatherData {
  temp: number;           // Celsius
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  city: string;
  outfit_advice: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  fetched_at: string;
}

export interface KoreanPhrase {
  id: string;
  category: "taxi" | "restaurant" | "shopping" | "emergency" | "greeting";
  korean: string;
  romanized: string;
  translation: string;
}

// ─── Form types ───────────────────────────────────────────────────────────────

export interface NewExpenseForm {
  title: string;
  category: ExpenseCategory;
  amount_krw: number;
  paid_by: string;
  shared_with: string[];    // user IDs
  split_equally: boolean;
  custom_splits?: Record<string, number>;
  notes?: string;
  expense_date: string;
}

export interface NewScheduleForm {
  title: string;
  description?: string;
  category: ActivityCategory;
  activity_date: string;
  start_time?: string;
  end_time?: string;
  place_name?: string;
  address?: string;
  lat?: number;
  lng?: number;
}
