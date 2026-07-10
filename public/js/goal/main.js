document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const streamKey = params.get('key');

  if (!streamKey) {
    document.body.innerHTML = '<h2 style="color: white; font-family: Inter; padding: 20px;">Missing Stream Key</h2>';
    return;
  }

  const titleEl = document.getElementById('goal-title');
  const currentEl = document.getElementById('goal-current');
  const targetEl = document.getElementById('goal-target');
  const fillEl = document.getElementById('goal-bar-fill');
  const pctEl = document.getElementById('goal-percentage');

  const formatIDR = (num) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const updateGoalUI = (goal) => {
    titleEl.textContent = goal.title;
    currentEl.textContent = formatIDR(goal.currentAmount);
    targetEl.textContent = formatIDR(goal.targetAmount);

    let pct = 0;
    if (goal.targetAmount > 0) {
      pct = (goal.currentAmount / goal.targetAmount) * 100;
    }
    
    // Cap at 100% visually for the bar width
    const displayPct = Math.min(100, pct);
    fillEl.style.width = displayPct + '%';
    
    // Add pulsing effect if goal reached
    if (pct >= 100) {
      fillEl.style.boxShadow = '0 0 20px #4ade80';
      fillEl.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    } else {
      fillEl.style.boxShadow = 'none';
      fillEl.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)';
    }
  };

  // 1. Fetch Initial Goal State
  try {
    const res = await fetch('/goal');
    if (res.ok) {
      const data = await res.json();
      updateGoalUI(data);
    }
  } catch (err) {
    console.error('Failed to fetch initial goal state', err);
  }

  // 2. Connect to Socket for Real-Time Updates
  const socket = io({ query: { streamKey } });

  socket.on('connect', () => {
    console.log('Connected to Goal Overlay');
  });

  socket.on('goal_update', (goal) => {
    updateGoalUI(goal);
    
    // Flash current text briefly
    currentEl.style.color = '#fff';
    currentEl.style.transform = 'scale(1.1)';
    setTimeout(() => {
      currentEl.style.color = '#4ade80';
      currentEl.style.transform = 'scale(1)';
    }, 300);
  });
});
