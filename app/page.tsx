"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Coins, Dices, Flame, Gift, House, LogOut, Settings, Sparkles, Sprout, Star, TicketCheck, UserRound } from "lucide-react";
import { Difficulty, GameState, Student, gachaItems, loadState, questions, rewards, saveState, stageFor, todayKey, SESSION_KEY } from "@/lib/game";

type View = "home" | "game" | "gacha" | "character";

function ItemArt({ id, className = "" }: { id: string; className?: string }) {
  const index = gachaItems.findIndex((x) => x.id === id);
  const col = Math.max(0, index) % 4; const row = Math.floor(Math.max(0, index) / 4);
  return <span className={`item-art ${className}`} style={{ backgroundPosition: `${(col / 3) * 100}% ${(row / 2) * 100}%` }} aria-hidden="true" />;
}

function Mascot({ student, large = false }: { student: Student; large?: boolean }) {
  const stage = stageFor(student.points);
  const item = gachaItems.find((x) => student.equipped.includes(x.id));
  if (stage.name === "たまご") return <div className={`egg ${large ? "mascot-large" : ""}`}><span>?</span></div>;
  return <div className={`mascot mascot-art ${large ? "mascot-large" : ""} evo-${student.evolution}`}><Image src="/art/sukusuku-mascot.png" alt="丸くてふしぎな相棒" width={300} height={300} priority={large} />{item && <ItemArt id={item.id} className="mascot-item" />}</div>;
}

function Login({ onLogin }: { onLogin: (student: Student) => void }) {
  const [code, setCode] = useState(""); const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault(); const found = loadState().students.find((s) => s.code === code.trim().toUpperCase() && s.enabled);
    if (!found) return setError("コードをもう一度たしかめてね");
    sessionStorage.setItem(SESSION_KEY, found.code); onLogin(found);
  }
  return <main className="login-shell"><div className="cloud cloud-a" /><div className="cloud cloud-b" /><section className="login-card"><div className="brand-mark">10</div><p className="eyebrow">すくすく数学</p><h1>ぴったり10を<br />つくろう！</h1><p className="login-copy">数を組み合わせて、ふしぎな相棒を育てよう。</p><form onSubmit={submit}><label htmlFor="student-code">じぶんのコード</label><input id="student-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="例：SUKU01" autoCapitalize="characters" />{error && <p className="error-text">{error}</p>}<button className="primary-button" type="submit">はじめる <Sparkles size={20} /></button></form><p className="demo-note">体験用コード：SUKU01</p></section></main>;
}

export default function StudentApp() {
  const [state, setState] = useState<GameState | null>(null); const [studentCode, setStudentCode] = useState<string | null>(null); const [view, setView] = useState<View>("home"); const [mode, setMode] = useState<Difficulty>("easy"); const [toast, setToast] = useState("");
  useEffect(() => { queueMicrotask(() => { setState(loadState()); setStudentCode(sessionStorage.getItem(SESSION_KEY)); }); }, []);
  const student = useMemo(() => state?.students.find((s) => s.code === studentCode) ?? null, [state, studentCode]);
  function updateStudent(next: Student) { if (!state) return; const nextState = { ...state, students: state.students.map((s) => s.code === next.code ? next : s) }; setState(nextState); saveState(nextState); }
  function flash(text: string) { setToast(text); window.setTimeout(() => setToast(""), 2600); }
  if (!state) return <main className="loading">よみこみ中…</main>;
  if (!student) return <Login onLogin={(s) => { setStudentCode(s.code); setState(loadState()); }} />;
  return <main className="student-shell">{toast && <div className="toast"><CheckCircle2 size={20} />{toast}</div>}<header className="student-header"><button className="avatar-button" onClick={() => setView("character")} aria-label="キャラクターを見る"><Mascot student={student} /></button><div className="header-brand"><span>すくすく数学</span><strong>ぴったり10</strong></div><div className="wallet"><span><Star size={17} fill="currentColor" />{student.points}</span><span><Coins size={17} />{student.coins}</span></div></header>
    {view !== "home" && <button className="back-button" onClick={() => setView("home")}><ArrowLeft size={20} />ホームにもどる</button>}
    {view === "home" && <Home student={student} state={state} onStudent={updateStudent} onView={setView} onMode={(m) => { setMode(m); setView("game"); }} flash={flash} />}
    {view === "game" && <Game student={student} mode={mode} onStudent={updateStudent} flash={flash} />}
    {view === "gacha" && <Gacha student={student} onStudent={updateStudent} flash={flash} />}
    {view === "character" && <Character student={student} onStudent={updateStudent} />}
    <nav className="game-dock" aria-label="ゲームメニュー"><button className={view === "home" ? "active" : ""} onClick={() => setView("home")}><House /><span>ホーム</span></button><button className={view === "game" && mode === "today" ? "active" : ""} onClick={() => { setMode("today"); setView("game"); }}><Sparkles /><span>今日の1問</span></button><button className={view === "gacha" ? "active" : ""} onClick={() => setView("gacha")}><Dices /><span>ガチャ</span></button><button className={view === "character" ? "active" : ""} onClick={() => setView("character")}><UserRound /><span>相棒</span></button></nav>
    <footer className="student-footer"><span>あせらなくて大丈夫。きょうの一歩が、ちゃんと力になる。</span><button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setStudentCode(null); }}><LogOut size={16} />おわる</button><Link href="/admin"><Settings size={15} />管理</Link></footer></main>;
}

function Home({ student, state, onStudent, onView, onMode, flash }: { student: Student; state: GameState; onStudent: (s: Student) => void; onView: (v: View) => void; onMode: (m: Difficulty) => void; flash: (s: string) => void }) {
  const [lesson, setLesson] = useState(""); const todayDone = student.claimedDays.includes(todayKey()); const stage = stageFor(student.points); const progress = Math.min(100, (student.points / stage.next) * 100);
  function claimLesson() { const active = state.lessonCode; if (!active || active.expiresAt < Date.now() || active.code !== lesson.trim()) return flash("コードがちがうか、時間が終わっています"); if (student.usedLessonCodes.includes(active.code)) return flash("このボーナスはもう受け取ったよ"); onStudent({ ...student, points: student.points + 10, coins: student.coins + 20, stamps: student.stamps + 1, usedLessonCodes: [...student.usedLessonCodes, active.code] }); setLesson(""); flash("出席ボーナス！ 10pt・20コイン GET"); }
  return <div className="home-content">
    <section className="lobby-stage">
      <div className="lobby-copy"><p className="welcome-label">WELCOME BACK!</p><h1>今日も<br /><mark>10をつくろう</mark></h1><button className={`lobby-play ${todayDone ? "done" : ""}`} onClick={() => !todayDone && onMode("today")}><span><Sparkles /></span><div><small>今日の1問</small><strong>{todayDone ? "クリア済み！" : "スペシャル問題へ"}</strong></div><b>{todayDone ? "✓" : "PLAY"}</b></button><div className="lobby-rewards"><span>今日の報酬</span><b>30 pt</b><b><Coins />30</b></div></div>
      <div className="companion-zone"><span className="companion-speech">{todayDone ? "今日もよくできたね！" : "いっしょに挑戦しよう！"}</span><div className="companion-glow" /><Mascot student={student} large /><div className="companion-status"><div><span>{stage.name}</span><b>{student.points} / {stage.next} pt</b></div><div className="mini-progress"><i style={{ width: `${progress}%` }} /></div></div></div>
      <div className="stage-stamp"><TicketCheck /><span>参加スタンプ</span><b>{student.stamps}</b></div>
    </section>
    <section className="lesson-card"><div className="lesson-icon"><Gift /></div><div><p className="eyebrow">授業に来たら</p><h2>授業コードでボーナス！</h2><p>10pt ＋ 20コイン ＋ 参加スタンプ</p></div><div className="lesson-form"><input value={lesson} onChange={(e) => setLesson(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="4けた" /><button onClick={claimLesson}>GET</button></div></section>
    <section className="section-head level-heading"><div><p className="eyebrow">FREE PLAY</p><h2>好きなレベルで遊ぶ</h2></div><span>何回でも挑戦できるよ</span></section>
    <div className="level-grid"><LevelCard mode="easy" title="簡単" subtitle="まずは気軽に" reward="5" icon="easy" onClick={onMode} /><LevelCard mode="normal" title="普通" subtitle="ちょうどいい" reward="10" icon="normal" onClick={onMode} /><LevelCard mode="challenge" title="チャレンジ" subtitle="腕だめし" reward="20" icon="challenge" onClick={onMode} /></div>
    <div className="quick-links"><button onClick={() => onView("gacha")}><Dices /><span><small>50コインで1回</small><b>ガチャを引く</b></span><strong>→</strong></button><button onClick={() => onView("character")}><UserRound /><span><small>相棒を育てる</small><b>キャラクター</b></span><strong>→</strong></button></div>
  </div>;
}

function LevelCard({ mode, title, subtitle, reward, icon, onClick }: { mode: Difficulty; title: string; subtitle: string; reward: string; icon: "easy" | "normal" | "challenge"; onClick: (m: Difficulty) => void }) { const Icon = icon === "easy" ? Sprout : icon === "normal" ? Star : Flame; return <button className={`level-card level-${mode}`} onClick={() => onClick(mode)}><span className="level-icon"><Icon /></span><div><p>{subtitle}</p><h3>{title}</h3><span>+{reward}pt　+{reward} <Coins size={14} /></span></div><b>→</b></button>; }

function Game({ student, mode, onStudent, flash }: { student: Student; mode: Difficulty; onStudent: (s: Student) => void; flash: (s: string) => void }) {
  const q = questions[mode]; const [expression, setExpression] = useState(""); const [result, setResult] = useState<"idle" | "wrong" | "correct">("idle"); const labels = { today: "今日の1問", easy: "簡単", normal: "普通", challenge: "チャレンジ" };
  function check() { if (!expression.trim()) return; const sanitized = expression.replace(/×/g, "*").replace(/÷/g, "/"); if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) return setResult("wrong"); try { const used = (expression.match(/\d+/g) ?? []).map(Number).sort((a, b) => a - b); const expected = [...q.numbers].sort((a, b) => a - b); const value = Function(`"use strict"; return (${sanitized})`)(); if (JSON.stringify(used) !== JSON.stringify(expected) || Math.abs(value - 10) > 1e-9) return setResult("wrong"); if (mode === "today" && student.claimedDays.includes(todayKey())) return flash("今日のごほうびは受け取りずみだよ"); const reward = rewards[mode]; onStudent({ ...student, points: student.points + reward.points, coins: student.coins + reward.coins, claimedDays: mode === "today" ? [...student.claimedDays, todayKey()] : student.claimedDays }); setResult("correct"); flash(`せいかい！ ${reward.points}pt・${reward.coins}コイン GET`); } catch { setResult("wrong"); } }
  function add(token: string) { if (result !== "correct") setExpression((v) => v + token); }
  return <section className="game-screen"><p className="eyebrow">{labels[mode]}</p><h1>ぴったり10をつくろう！</h1><p className="game-hint">{q.hint}</p><div className="number-row">{q.numbers.map((n, i) => <button key={i} onClick={() => add(String(n))}>{n}</button>)}</div><div className={`expression-box ${result}`}><span>{expression || "ここに式ができるよ"}</span>{result === "correct" && <b>= 10 ✨</b>}</div><div className="operator-row">{["+", "−", "×", "÷", "(", ")"].map((x) => <button key={x} onClick={() => add(x === "−" ? "-" : x)}>{x}</button>)}</div>{result === "wrong" && <p className="try-again">おしい！ 数を全部1回ずつ使って、もう一度ためそう。</p>}<div className="game-actions"><button className="clear-button" onClick={() => { setExpression(""); setResult("idle"); }}>けす</button><button className="primary-button" onClick={check}>こたえる</button></div><p className="prototype-note">※問題は動作確認用です。正式な問題設定は最後に調整します。</p></section>;
}

function Gacha({ student, onStudent, flash }: { student: Student; onStudent: (s: Student) => void; flash: (s: string) => void }) {
  const [prize, setPrize] = useState<(typeof gachaItems)[number] | null>(null); const [spinning, setSpinning] = useState(false); const remaining = gachaItems.filter((x) => !student.inventory.includes(x.id));
  function draw() { if (student.coins < 50) return flash("コインが足りないよ。問題に挑戦して集めよう！"); if (!remaining.length) return flash("アイテムを全部集めたよ！"); setSpinning(true); setPrize(null); window.setTimeout(() => { const got = remaining[Math.floor(Math.random() * remaining.length)]; onStudent({ ...student, coins: student.coins - 50, inventory: [...student.inventory, got.id] }); setPrize(got); setSpinning(false); }, 1100); }
  return <section className="gacha-screen"><p className="eyebrow">新しいおしゃれを見つけよう</p><h1>ふしぎガチャ</h1><div className={`gacha-machine ${spinning ? "spinning" : ""}`}><div className="gacha-window">{prize ? <ItemArt id={prize.id} className="prize-art" /> : <Sparkles />}</div><div className="gacha-body"><i /><i /><i /></div></div>{prize ? <div className="prize"><p>GET!</p><strong>{prize.name}</strong><span>キャラクター画面でつけられるよ</span></div> : <p className="gacha-copy">かぶりなし。まだ持っていないアイテムが必ず出ます。</p>}<button className="primary-button gacha-button" onClick={draw} disabled={spinning}>{spinning ? "ガチャガチャ…" : "50コインでまわす"}</button><p className="gacha-count">あと {remaining.length}種類</p></section>;
}

function Character({ student, onStudent }: { student: Student; onStudent: (s: Student) => void }) {
  const stage = stageFor(student.points); const percent = Math.min(100, (student.points / stage.next) * 100); function toggle(id: string) { onStudent({ ...student, equipped: student.equipped.includes(id) ? student.equipped.filter((x) => x !== id) : [id] }); }
  return <section className="character-screen"><div className="character-stage"><div><p className="eyebrow">あなたの相棒</p><h1>{stage.name}</h1><Mascot student={student} large /></div><div className="growth-panel"><div><span>成長</span><b>{student.points} / {stage.next} pt</b></div><div className="progress"><i style={{ width: `${percent}%` }} /></div><p>{student.points < 30 ? `あと${30 - student.points}ptで、たまごがかえるかも！` : "問題にこたえるほど、相棒が育つよ。"}</p></div></div>{student.points >= 120 && <div className="evolution-picker"><h2>せいかくをえらぶ</h2><div>{(["ふわふわ", "メカ", "しぜん", "ふしぎ"] as const).map((x) => <button className={student.evolution === x ? "selected" : ""} onClick={() => onStudent({ ...student, evolution: x })} key={x}>{x}</button>)}</div></div>}<div className="closet"><h2>もっているアイテム</h2>{student.inventory.length ? <div className="item-grid">{gachaItems.filter((x) => student.inventory.includes(x.id)).map((x) => <button key={x.id} className={student.equipped.includes(x.id) ? "equipped" : ""} onClick={() => toggle(x.id)}><ItemArt id={x.id} /><b>{x.name}</b><small>{student.equipped.includes(x.id) ? "つけている" : x.kind}</small></button>)}</div> : <div className="empty-closet">ガチャでアイテムを集めよう！</div>}</div></section>;
}
