// shared.js
// admin.html と index.html（参加者用）の両方から読み込まれる共通ロジック。
// Supabase接続情報、両ページで使う純粋関数のみを置く。
// 管理者専用ロジック(卓組・確定処理等)は admin.html に、
// 参加者専用ロジック(結果送信・タイブレーク再計算等)は index.html に置く。

const SUPABASE_URL = 'https://xizsnqlhbswnhvgkwsqt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_K8PqzA8680tC5GECdpDC5w_RbQueZDd';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

function applyResultAutoGame(result, gw1, gw2){
  if(result === 'p1' && gw1 === 0) gw1 = 1;
  if(result === 'p2' && gw2 === 0) gw2 = 1;
  return { gw1, gw2 };
}

async function checkConnection(targetId='conn-status'){
  try {
    const { error } = await db.from('tournaments').select('id').limit(1);
    const el = document.getElementById(targetId);
    if(!el) return;
    if(error){ el.textContent='接続エラー'; el.className='conn-status conn-err'; }
    else{ el.textContent='接続OK'; el.className='conn-status conn-ok'; }
  } catch(e) {
    const el = document.getElementById(targetId);
    if(el) el.textContent='接続エラー';
  }
}

function getPoints(p){ return p.wins*3 + p.draws; }

function calcMatchWinPct(p){
  const wins = p.wins || 0, losses = p.losses || 0, draws = p.draws || 0;
  const total = wins + losses + draws;
  if(total === 0) return 1/3;
  const points = wins*3 + draws;
  return Math.max(points / (total*3), 1/3);
}

function sortMatchesForTables(matches, players){
  const playerMap = new Map(players.map(p => [p.id, p]));
  const p1Id = m => m.p1 || m.p1_id;
  const p2Id = m => m.p2 || m.p2_id;
  const score = id => {
    const p = playerMap.get(id);
    return p ? getPoints(p) : 0;
  };
  const name = id => playerMap.get(id)?.name || '';
  return matches.sort((a,b)=>{
    const ap = Math.max(score(p1Id(a)), score(p2Id(a)));
    const bp = Math.max(score(p1Id(b)), score(p2Id(b)));
    if(bp !== ap) return bp - ap;
    const an = [name(p1Id(a)), name(p2Id(a))].sort().join('|');
    const bn = [name(p1Id(b)), name(p2Id(b))].sort().join('|');
    return an.localeCompare(bn, 'ja');
  });
}