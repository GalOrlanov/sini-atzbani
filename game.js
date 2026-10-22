(() => {
  const grid = document.querySelector('#grid');
  const emptyState = document.querySelector('#emptyState');
  const startBtn = document.querySelector('#startBtn');
  const restartBtn = document.querySelector('#restartBtn');
  const playAgainBtn = document.querySelector('#playAgainBtn');
  const setupControls = document.querySelector('#setupControls');
  const gameStatus = document.querySelector('#gameStatus');
  const statusText = document.querySelector('#statusText');
  const loserDialog = document.querySelector('#loserDialog');
  const loserFace = document.querySelector('#loserFace');
  const soundBtn = document.querySelector('#soundBtn');
  const fakeToggle = document.querySelector('#fakeToggle');

  const state = { count: 16, loser: -1, active: false, sound: true, opened: 0 };
  const faces = ['🙂', '😐', '🫤', '😏', '🤨', '😑'];
  const customImages = ['assets/sini-normal.png'];

  function columnsFor(count) { return Math.sqrt(count); }

  function faceMarkup(index, angry = false) {
    if (angry) {
      return '<span class="face-emoji">😡</span>';
    }
    if (customImages.length) {
      const src = customImages[index % customImages.length];
      return `<img class="face-image" src="${src}" alt="פרצוף">`;
    }
    const emoji = fakeToggle.checked ? faces[index % faces.length] : '🙂';
    return `<span class="face-emoji">${emoji}</span>`;
  }

  function buildBoard() {
    grid.innerHTML = '';
    grid.style.setProperty('--cols', columnsFor(state.count));
    for (let i = 0; i < state.count; i += 1) {
      const button = document.createElement('button');
      button.className = 'face-tile';
      button.type = 'button';
      button.dataset.index = String(i);
      button.setAttribute('aria-label', `פרצוף ${i + 1}`);
      button.innerHTML = faceMarkup(i);
      button.addEventListener('click', onPick);
      grid.appendChild(button);
    }
    emptyState.classList.add('hidden');
  }

  function randomLoser() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % state.count;
  }

  function startGame() {
    state.loser = randomLoser();
    state.opened = 0;
    state.active = true;
    buildBoard();
    setupControls.classList.add('hidden');
    gameStatus.classList.remove('hidden');
    statusText.textContent = 'בחרו פרצוף בתורכם…';
    ping(360, .06);
  }

  function resetGame() {
    if (loserDialog.open) loserDialog.close();
    startGame();
  }

  function onPick(event) {
    if (!state.active) return;
    const tile = event.currentTarget;
    const index = Number(tile.dataset.index);
    if (index === state.loser) {
      state.active = false;
      tile.innerHTML = faceMarkup(index, true);
      tile.style.background = '#ffce2e';
      loserFace.innerHTML = faceMarkup(index, true);
      alarm();
      setTimeout(() => loserDialog.showModal(), 260);
      return;
    }
    state.opened += 1;
    tile.classList.add('revealed');
    statusText.textContent = `נשארו ${state.count - state.opened} פרצופים…`;
    ping(560, .045);
    if (state.sound && navigator.vibrate) navigator.vibrate(24);
  }

  function audioContext() {
    return new (window.AudioContext || window.webkitAudioContext)();
  }

  function ping(freq, duration) {
    if (!state.sound) return;
    try {
      const ctx = audioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration);
      osc.addEventListener('ended', () => ctx.close());
    } catch (_) {}
  }

  function alarm() {
    if (state.sound && navigator.vibrate) navigator.vibrate([180, 70, 180, 70, 360]);
    if (!state.sound) return;
    [180, 145, 120].forEach((frequency, i) => setTimeout(() => ping(frequency, .22), i * 170));
  }

  document.querySelectorAll('.count-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.count-btn').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.count = Number(button.dataset.count);
    });
  });

  soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    soundBtn.setAttribute('aria-pressed', String(state.sound));
    soundBtn.textContent = state.sound ? '🔊 צליל ורטט' : '🔇 ללא צליל';
  });
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', resetGame);
  playAgainBtn.addEventListener('click', resetGame);

  window.SiniAtzbani = {
    setImages(urls) {
      customImages.splice(0, customImages.length, ...urls.filter(Boolean));
      if (state.active) buildBoard();
    }
  };
})();
