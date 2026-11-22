(() => {
  'use strict';

  const examples = {
    cpp: {
      filename: 'engine.cpp',
      language: 'C++',
      label: 'Illustrative C++ code',
      html: `<span class="tok-keyword">#include</span> <span class="tok-string">&lt;vector&gt;</span>\n<span class="tok-keyword">#include</span> <span class="tok-string">&lt;chrono&gt;</span>\n\n<span class="tok-keyword">namespace</span> <span class="tok-type">engineering</span> {\n  <span class="tok-keyword">constexpr auto</span> focus = <span class="tok-string">"performance"</span>;\n\n  <span class="tok-keyword">void</span> <span class="tok-function">build</span>() {\n    <span class="tok-comment">// measure. profile. improve.</span>\n  }\n}`
    },
    ml: {
      filename: 'model.py',
      language: 'Python',
      label: 'Illustrative Python code',
      html: `<span class="tok-keyword">import</span> numpy <span class="tok-keyword">as</span> np\n\n<span class="tok-keyword">class</span> <span class="tok-type">NeuralNetwork</span>:\n    <span class="tok-keyword">def</span> <span class="tok-function">forward</span>(self, x):\n        <span class="tok-keyword">for</span> layer <span class="tok-keyword">in</span> self.layers:\n            x = layer.forward(x)\n        <span class="tok-keyword">return</span> x\n\n    <span class="tok-comment"># understand every gradient</span>`
    },
    quant: {
      filename: 'pricing.hpp',
      language: 'C++',
      label: 'Illustrative quantitative C++ code',
      html: `<span class="tok-keyword">struct</span> <span class="tok-type">Statistics</span> {\n  <span class="tok-keyword">double</span> mean;\n  <span class="tok-keyword">double</span> std_error;\n};\n\n<span class="tok-type">Statistics</span> <span class="tok-function">estimate</span>(\n    <span class="tok-keyword">const</span> Paths&amp; paths);\n\n<span class="tok-comment">// precision in every step</span>`
    }
  };

  const buttons = Array.from(document.querySelectorAll('[data-code]'));
  const editor = document.getElementById('editor-code');
  const filename = document.getElementById('file-name');
  const editorFooter = document.querySelector('.terminal-frame__footer > span:last-child');

  function selectCode(name) {
    const snippet = examples[name];
    if (!snippet || !editor) return;
    editor.innerHTML = snippet.html;
    editor.setAttribute('aria-label', snippet.label);
    filename.textContent = snippet.filename;
    if (editorFooter) editorFooter.innerHTML = `UTF-8 <span class="footer-separator">·</span> ${snippet.language}`;
    buttons.forEach(button => {
      const selected = button.dataset.code === name;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => selectCode(button.dataset.code));
    button.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectCode(buttons[next].dataset.code);
      buttons[next].focus();
    });
  });
  selectCode('cpp');

  const menuButton = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (menuButton && nav) {
    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    }
    menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
    window.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 820) setMenu(false); });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px 35px 0px' });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }

  const canvas = document.getElementById('snowfield');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let flakes = [];
  let frameId = 0;
  let lastFrame = 0;
  let wind = 0;
  let running = !reducedMotion.matches;
  let seed = 260218;
  const motionButton = document.getElementById('motion-toggle');
  const motionLabel = document.getElementById('motion-label');

  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function createFlake(randomY = true) {
    const depth = random();
    return {
      x: random() * width,
      y: randomY ? random() * height : -12 - random() * 30,
      radius: 0.42 + depth * 1.6,
      velocity: .20 + depth * .67,
      drift: (random() - .5) * .32,
      phase: random() * Math.PI * 2,
      phaseSpeed: .00028 + random() * .00028,
      amplitude: .1 + random() * .29,
      opacity: .17 + depth * .42,
      blue: random() > .76
    };
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.7);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const targetCount = Math.max(35, Math.min(105, Math.round(width * height / 17000)));
    flakes = Array.from({ length: targetCount }, () => createFlake());
    if (!running) drawStatic();
  }

  function paintFlake(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.blue ? `rgba(93, 217, 246, ${p.opacity})` : `rgba(222, 245, 255, ${p.opacity})`;
    ctx.fill();
    if (p.radius > 1.6 && p.blue) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77, 207, 244, ${p.opacity * .06})`;
      ctx.fill();
    }
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    flakes.forEach(paintFlake);
  }

  function tick(timestamp) {
    if (!running) return;
    const elapsed = Math.min((timestamp - (lastFrame || timestamp)) / 16.67, 2.2);
    lastFrame = timestamp;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < flakes.length; i++) {
      const p = flakes[i];
      p.y += p.velocity * elapsed;
      p.x += (p.drift + wind * .13 + Math.sin(timestamp * p.phaseSpeed + p.phase) * p.amplitude) * elapsed;
      if (p.y > height + 7) flakes[i] = createFlake(false);
      if (p.x > width + 8) p.x = -5;
      if (p.x < -8) p.x = width + 5;
      paintFlake(flakes[i]);
    }
    frameId = requestAnimationFrame(tick);
  }

  function updateButton() {
    if (!motionButton) return;
    motionButton.setAttribute('aria-pressed', String(running));
    motionButton.setAttribute('aria-label', running ? 'Pause snowfall' : 'Resume snowfall');
    motionButton.title = running ? 'Pause snowfall' : 'Resume snowfall';
    if (motionLabel) motionLabel.textContent = running ? 'Snow on' : 'Snow off';
  }

  function setRunning(shouldRun) {
    running = shouldRun;
    cancelAnimationFrame(frameId);
    lastFrame = 0;
    updateButton();
    if (running && !document.hidden) frameId = requestAnimationFrame(tick);
    else drawStatic();
  }

  if (motionButton) motionButton.addEventListener('click', () => setRunning(!running));
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frameId);
    lastFrame = 0;
    if (running && !document.hidden) frameId = requestAnimationFrame(tick);
  });
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse') wind = (event.clientX / Math.max(width, 1) - .5) * 1.2;
  }, { passive: true });

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(document.documentElement);
  resize();
  updateButton();
  if (running) frameId = requestAnimationFrame(tick);
})();
