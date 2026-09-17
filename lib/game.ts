export type Difficulty = "today" | "easy" | "normal" | "challenge";

export type Student = {
  code: string;
  enabled: boolean;
  points: number;
  coins: number;
  stamps: number;
  inventory: string[];
  equipped: string[];
  evolution: "ふわふわ" | "メカ" | "しぜん" | "ふしぎ";
  claimedDays: string[];
  usedLessonCodes: string[];
};

export type LessonCode = { code: string; expiresAt: number } | null;
export type GameState = { students: Student[]; lessonCode: LessonCode; adminLog: string[] };

export const STORAGE_KEY = "sukusuku-ten-state-v1";
export const SESSION_KEY = "sukusuku-ten-session-v1";
export const defaultState: GameState = {
  students: [{ code: "SUKU01", enabled: true, points: 25, coins: 70, stamps: 1, inventory: ["red-cap"], equipped: ["red-cap"], evolution: "ふわふわ", claimedDays: [], usedLessonCodes: [] }],
  lessonCode: null,
  adminLog: ["体験用アカウント SUKU01 を作成"],
};

export const rewards: Record<Difficulty, { points: number; coins: number }> = {
  today: { points: 30, coins: 30 }, easy: { points: 5, coins: 5 }, normal: { points: 10, coins: 10 }, challenge: { points: 20, coins: 20 },
};

export const gachaItems = [
  { id: "red-cap", name: "りんごキャップ", emoji: "🧢", kind: "あたま" },
  { id: "star-glasses", name: "ほしメガネ", emoji: "🤩", kind: "かお" },
  { id: "headphones", name: "ふわふわヘッドホン", emoji: "🎧", kind: "あたま" },
  { id: "blue-cape", name: "そらいろマント", emoji: "🦸", kind: "からだ" },
  { id: "mini-bag", name: "ミニリュック", emoji: "🎒", kind: "からだ" },
  { id: "magic-wand", name: "ひかるステッキ", emoji: "🪄", kind: "もちもの" },
  { id: "leaf-crown", name: "はっぱのかんむり", emoji: "🌿", kind: "あたま" },
  { id: "space-ring", name: "ほしのわっか", emoji: "🪐", kind: "エフェクト" },
  { id: "rainbow", name: "にじのオーラ", emoji: "🌈", kind: "エフェクト" },
  { id: "night-bg", name: "よぞらのへや", emoji: "🌙", kind: "はいけい" },
  { id: "flower", name: "おはなポシェット", emoji: "🌼", kind: "からだ" },
  { id: "game-pad", name: "ミニゲーム機", emoji: "🎮", kind: "もちもの" },
] as const;

export const questions: Record<Difficulty, { numbers: number[]; hint: string }> = {
  today: { numbers: [2, 3, 5], hint: "3つの数を1回ずつ使おう" },
  easy: { numbers: [4, 6], hint: "たし算から試してみよう" },
  normal: { numbers: [2, 4, 6], hint: "3つの数を1回ずつ使おう" },
  challenge: { numbers: [1, 3, 4, 6], hint: "カッコやわり算も使えるよ" },
};

export function loadState(): GameState {
  if (typeof window === "undefined") return defaultState;
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : defaultState; }
  catch { return defaultState; }
}
export function saveState(state: GameState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); window.dispatchEvent(new Event("sukusuku-state")); }
export function todayKey() { return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function stageFor(points: number) {
  if (points < 30) return { name: "はじまり", next: 30 };
  if (points < 120) return { name: "ちびっこ", next: 120 };
  if (points < 300) return { name: "なかま", next: 300 };
  return { name: "マスター", next: 500 };
}
