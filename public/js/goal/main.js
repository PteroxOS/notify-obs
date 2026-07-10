document.addEventListener('DOMContentLoaded', async () => {
  const params    = new URLSearchParams(window.location.search);
  const streamKey = params.get('key');

  if (!streamKey) {
    document.body.innerHTML =
      '<p style="color:#fff;font-family:Inter;padding:16px;">Missing stream key.</p>';
    return;
  }

  const container = document.getElementById('goal-container');
  const titleEl   = document.getElementById('goal-title');
  const currentEl = document.getElementById('goal-current');
  const targetEl  = document.getElementById('goal-target');
  const pctEl     = document.getElementById('goal-pct');
  const fillEl    = document.getElementById('goal-bar-fill');

  const fmt = (n) => 'Rp\u00a0' + Number(n).toLocaleString('id-ID');

  const update = (goal) => {
    titleEl.textContent   = goal.title;
    currentEl.textContent = fmt(goal.currentAmount);
    targetEl.textContent  = fmt(goal.targetAmount);

    const rawPct   = goal.targetAmount > 0
      ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const barWidth = Math.min(100, rawPct);

    fillEl.style.width    = barWidth + '%';
    pctEl.textContent     = Math.round(rawPct) + '%';

    container.classList.toggle('goal-completed', rawPct >= 100);
  };

  try {
    const res = await fetch('/goal');
    if (res.ok) update(await res.json());
  } catch (e) {
    console.error('[Goal] fetch error', e);
  }

  const socket = io({ query: { streamKey } });
  socket.on('connect', () => console.log('[Goal] connected'));
  socket.on('goal_update', (goal) => {
    update(goal);
    currentEl.classList.remove('bump');
    void currentEl.offsetWidth;
    currentEl.classList.add('bump');
  });
});
