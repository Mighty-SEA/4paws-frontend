import staticDefaultsRaw from "@/config/default-mix-prices.json";

type RawDefaults = Record<string, unknown>;
type MixPriceMap = Record<string, number>;

const USER_STORAGE_KEY = "mix-price-defaults.v1";
const REMOTE_STORAGE_KEY = "mix-price-defaults.remote.v1";
const API_ENDPOINT = "/api/mix-price-defaults";

const normalizeKey = (label: string | null | undefined): string => (label ?? "").trim().toLowerCase();

const toPositiveInteger = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(String(value));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
};

const buildStaticDefaults = (raw: RawDefaults): MixPriceMap => {
  const normalized: MixPriceMap = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (!key || key.startsWith("_")) continue;
    const normalizedKey = normalizeKey(key);
    const numeric = toPositiveInteger(value);
    if (!normalizedKey || numeric == null) continue;
    normalized[normalizedKey] = numeric;
  }
  return normalized;
};

const STATIC_DEFAULTS: MixPriceMap = buildStaticDefaults(staticDefaultsRaw as RawDefaults);

let cachedUserDefaults: MixPriceMap | null = null;
let cachedRemoteDefaults: MixPriceMap = {};
let remoteDefaultsLoaded = false;
let remoteDefaultsLoading: Promise<void> | null = null;

const readFromStorage = (key: string): MixPriceMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RawDefaults;
    return buildStaticDefaults(parsed);
  } catch (error) {
    console.warn(`mix-price-defaults: gagal membaca ${key}`, error);
    return {};
  }
};

const writeToStorage = (key: string, map: MixPriceMap) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch (error) {
    console.warn(`mix-price-defaults: gagal menyimpan ${key}`, error);
  }
};

const readUserDefaults = (): MixPriceMap => {
  if (cachedUserDefaults) return cachedUserDefaults;
  cachedUserDefaults = readFromStorage(USER_STORAGE_KEY);
  return cachedUserDefaults;
};

const writeUserDefaults = (map: MixPriceMap) => {
  cachedUserDefaults = map;
  writeToStorage(USER_STORAGE_KEY, map);
};

const readRemoteDefaultsFromCache = () => {
  if (typeof window === "undefined") return;
  cachedRemoteDefaults = readFromStorage(REMOTE_STORAGE_KEY);
};

if (typeof window !== "undefined") {
  readRemoteDefaultsFromCache();
}

const getRemoteDefaults = () => cachedRemoteDefaults;

const setRemoteDefaults = (map: MixPriceMap) => {
  cachedRemoteDefaults = map;
  writeToStorage(REMOTE_STORAGE_KEY, map);
};

const getCombinedDefaults = (): MixPriceMap => {
  const userDefaults = cachedUserDefaults ?? readUserDefaults();
  return { ...STATIC_DEFAULTS, ...getRemoteDefaults(), ...userDefaults };
};

export const loadMixPriceDefaults = async () => {
  if (typeof window === "undefined") return;
  if (remoteDefaultsLoaded) return;
  if (remoteDefaultsLoading) return remoteDefaultsLoading;

  remoteDefaultsLoading = (async () => {
    try {
      const res = await fetch(API_ENDPOINT, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json().catch(() => [])) as Array<{
        name?: string;
        displayName?: string;
        price?: string | number;
      }>;
      const map: MixPriceMap = {};
      for (const item of data ?? []) {
        const label = item.displayName ?? item.name ?? "";
        const normalized = normalizeKey(label);
        if (!normalized) continue;
        const numeric = toPositiveInteger(item.price ?? 0);
        if (numeric == null) continue;
        map[normalized] = numeric;
      }
      setRemoteDefaults(map);
      const currentUser = readUserDefaults();
      writeUserDefaults({ ...map, ...currentUser });
      remoteDefaultsLoaded = true;
    } catch (error) {
      console.warn("mix-price-defaults: gagal memuat defaults dari server", error);
    }
  })().finally(() => {
    remoteDefaultsLoading = null;
  });

  return remoteDefaultsLoading;
};

export const getMixPriceSuggestion = (label: string | null | undefined): number | undefined => {
  const key = normalizeKey(label);
  if (!key) return undefined;
  const userDefaults = cachedUserDefaults ?? readUserDefaults();
  if (userDefaults[key] != null) return userDefaults[key];
  const remoteDefaults = getRemoteDefaults();
  if (remoteDefaults[key] != null) return remoteDefaults[key];
  if (STATIC_DEFAULTS[key] != null) return STATIC_DEFAULTS[key];
  return undefined;
};

const pendingRemoteUpdates = new Map<string, number>();

const sendRemoteUpdate = (key: string, label: string, price: number) => {
  if (typeof window === "undefined") return;
  // Avoid duplicate POSTs for the same value in quick succession
  if (pendingRemoteUpdates.get(key) === price) return;
  pendingRemoteUpdates.set(key, price);
  void fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: label, displayName: label, price }),
  })
    .then(async (res) => {
      if (!res.ok) return;
      const payload = await res.json().catch(() => null);
      const updatedPrice = toPositiveInteger((payload as any)?.price ?? price) ?? price;
      const updatedLabel = normalizeKey((payload as any)?.displayName ?? label);
      if (!updatedLabel) return;
      const remote = { ...getRemoteDefaults(), [updatedLabel]: updatedPrice };
      setRemoteDefaults(remote);
      const currentUser = { ...readUserDefaults(), [updatedLabel]: updatedPrice };
      writeUserDefaults(currentUser);
    })
    .catch((error) => {
      console.warn("mix-price-defaults: gagal menyimpan ke server", error);
    })
    .finally(() => {
      pendingRemoteUpdates.delete(key);
    });
};

export const rememberMixPrice = (label: string | null | undefined, price: string | number | null | undefined) => {
  if (typeof window === "undefined") return;
  const key = normalizeKey(label);
  if (!key) return;
  const numeric = toPositiveInteger(price);
  if (numeric == null) return;
  const displayLabel = (label ?? "").trim() || key;
  const current = readUserDefaults();
  if (current[key] !== numeric) {
    const next = { ...current, [key]: numeric };
    writeUserDefaults(next);
  }
  const remote = getRemoteDefaults();
  if (remote[key] !== numeric) {
    setRemoteDefaults({ ...remote, [key]: numeric });
    sendRemoteUpdate(key, displayLabel, numeric);
  }
};

export const forgetMixPrice = (label: string | null | undefined) => {
  if (typeof window === "undefined") return;
  const key = normalizeKey(label);
  if (!key) return;
  const current = readUserDefaults();
  if (!(key in current)) return;
  const { [key]: _removed, ...rest } = current;
  writeUserDefaults(rest);
};

export const getAllMixPriceDefaults = (): MixPriceMap => getCombinedDefaults();

