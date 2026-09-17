"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coins, Copy, Download, KeyRound, Plus, Power, RefreshCw, Save, Star, TicketCheck, Users } from "lucide-react";
import { GameState, Student, loadState, saveState } from "@/lib/game";

export default function AdminPage() {
  const [state, setState] = useState<GameState | null>(null); const [notice, setNotice] = useState(""); const [now, setNow] = useState(0);
  useEffect(() => { queueMicrotask(() => { setState(loadState()); setNow(Date.now()); }); }, []);
  function commit(next: GameState, message?: string) { setState(next); saveState(next); if (message) { setNotice(message); window.setTimeout(() => setNotice(""), 2200); } }
  if (!state) return <main className="loading">よみこみ中…</main>;
  const currentState = state;
  const activeLesson = currentState.lessonCode && currentState.lessonCode.expiresAt > now ? currentState.lessonCode : null;
  function createLesson() { const code = String(Math.floor(1000 + Math.random() * 9000)); commit({ ...currentState, lessonCode: { code, expiresAt: Date.now() + 60 * 60 * 1000 }, adminLog: [`授業コード ${code} を発行`, ...currentState.adminLog] }, "授業コードを発行しました"); }
  function addStudent() { let code = ""; do { code = `SK${Math.random().toString(36).slice(2, 6).toUpperCase()}`; } while (currentState.students.some((s) => s.code === code)); const student: Student = { code, enabled: true, points: 0, coins: 0, stamps: 0, inventory: [], equipped: [], evolution: "ふわふわ", claimedDays: [], usedLessonCodes: [] }; commit({ ...currentState, students: [...currentState.students, student], adminLog: [`生徒コード ${code} を作成`, ...currentState.adminLog] }, `${code} を作成しました`); }
  function editStudent(code: string, patch: Partial<Student>, message?: string) { commit({ ...currentState, students: currentState.students.map((s) => s.code === code ? { ...s, ...patch } : s) }, message); }
  function downloadCsv() { const csv = ["生徒コード,有効,ポイント,コイン,参加スタンプ,アイテム数", ...currentState.students.map((s) => `${s.code},${s.enabled ? "有効" : "停止"},${s.points},${s.coins},${s.stamps},${s.inventory.length}`)].join("\n"); const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "すくすく管理データ.csv"; a.click(); URL.revokeObjectURL(a.href); }

  return <main className="admin-shell">{notice && <div className="toast"><Save size={18} />{notice}</div>}<header className="admin-header"><div><p className="eyebrow">すくすく数学</p><h1>管理ダッシュボード</h1></div><Link href="/"><ArrowLeft size={18} />生徒画面</Link></header>
    <section className="stat-grid"><div><span><Users /></span><p>生徒コード</p><b>{state.students.length}</b></div><div><span><Star /></span><p>合計ポイント</p><b>{state.students.reduce((a, s) => a + s.points, 0)}</b></div><div><span><Coins /></span><p>合計コイン</p><b>{state.students.reduce((a, s) => a + s.coins, 0)}</b></div><div><span><TicketCheck /></span><p>参加スタンプ</p><b>{state.students.reduce((a, s) => a + s.stamps, 0)}</b></div></section>
    <section className="admin-card lesson-admin"><div><p className="eyebrow">授業のはじめに</p><h2>授業コード</h2><p>発行から60分間、1人1回だけ使えます。</p></div>{activeLesson ? <div className="active-code"><span>現在のコード</span><strong>{activeLesson.code}</strong><button onClick={() => navigator.clipboard.writeText(activeLesson.code)}><Copy size={17} />コピー</button></div> : <div className="inactive-code">有効なコードはありません</div>}<button className="admin-action" onClick={createLesson}><RefreshCw size={18} />{activeLesson ? "新しいコードにする" : "コードを発行"}</button></section>
    <section className="admin-card"><div className="admin-title"><div><p className="eyebrow">個人名は登録しません</p><h2>生徒コード管理</h2></div><div><button onClick={downloadCsv}><Download size={17} />CSV保存</button><button className="admin-action" onClick={addStudent}><Plus size={17} />コード作成</button></div></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>コード</th><th>状態</th><th>pt</th><th>コイン</th><th>スタンプ</th><th>調整</th></tr></thead><tbody>{state.students.map((s) => <tr key={s.code}><td><button className="copy-code" onClick={() => navigator.clipboard.writeText(s.code)}><KeyRound size={14} />{s.code}<Copy size={13} /></button></td><td><button className={`status ${s.enabled ? "on" : "off"}`} onClick={() => editStudent(s.code, { enabled: !s.enabled }, `${s.code} を${s.enabled ? "停止" : "有効化"}しました`)}><Power size={13} />{s.enabled ? "有効" : "停止"}</button></td><td><input type="number" value={s.points} onChange={(e) => editStudent(s.code, { points: Math.max(0, Number(e.target.value)) })} /></td><td><input type="number" value={s.coins} onChange={(e) => editStudent(s.code, { coins: Math.max(0, Number(e.target.value)) })} /></td><td>{s.stamps}</td><td><button className="tiny-add" onClick={() => editStudent(s.code, { points: s.points + 10, coins: s.coins + 10 }, `${s.code} に10pt・10コイン追加`)}>+10</button></td></tr>)}</tbody></table></div><p className="save-hint">数値を変更すると自動保存されます。公開前に変更理由の記録欄を追加予定です。</p></section>
    <section className="admin-card"><p className="eyebrow">最近の操作</p><h2>管理ログ</h2><ul className="admin-log">{state.adminLog.slice(0, 8).map((x, i) => <li key={i}>{x}</li>)}</ul></section>
    <footer className="admin-footer"><b>端末内の試作版</b><span>認証機能はありません。現在はこの端末内だけに保存され、ほかの端末の生徒データは操作できません。</span></footer>
  </main>;
}
