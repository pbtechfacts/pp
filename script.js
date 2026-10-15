/**
 * Third Eye TTS - Accessibility & Policy Interactivity Script
 * WCAG 2.1 Compliant, Screen Reader & TalkBack Friendly
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeManager();
  initContrastManager();
  initTextSizeManager();
  initWebSpeechTTS();
  initSearchEngine();
  initTableOfContentsSpy();
  initModalManager();
  initPrintSupport();
});

/* ==========================================================================
   1. Theme Manager (Dark / Light)
   ========================================================================== */
function initThemeManager() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIconDark = document.getElementById('theme-icon-dark');
  const themeIconLight = document.getElementById('theme-icon-light');
  const themeText = document.getElementById('theme-text');
  const htmlEl = document.documentElement;

  if (!themeToggle) return;

  const savedTheme = localStorage.getItem('thirdeye_theme') || 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('thirdeye_theme', newTheme);
  });

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      themeIconDark?.classList.remove('hidden');
      themeIconLight?.classList.add('hidden');
      if (themeText) themeText.textContent = 'Dark';
    } else {
      themeIconDark?.classList.add('hidden');
      themeIconLight?.classList.remove('hidden');
      if (themeText) themeText.textContent = 'Light';
    }
  }
}

/* ==========================================================================
   2. High Contrast Manager (For Visually Impaired Users)
   ========================================================================== */
function initContrastManager() {
  const contrastBtn = document.getElementById('high-contrast-toggle');
  const contrastText = document.getElementById('contrast-text');
  const htmlEl = document.documentElement;

  if (!contrastBtn) return;

  const savedContrast = localStorage.getItem('thirdeye_contrast') || 'normal';
  applyContrast(savedContrast);

  contrastBtn.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-contrast') || 'normal';
    const next = current === 'high' ? 'normal' : 'high';
    applyContrast(next);
    localStorage.setItem('thirdeye_contrast', next);
  });

  function applyContrast(contrast) {
    htmlEl.setAttribute('data-contrast', contrast);
    const isHigh = contrast === 'high';
    contrastBtn.setAttribute('aria-pressed', isHigh ? 'true' : 'false');
    if (contrastText) {
      contrastText.textContent = isHigh ? 'High Contrast: ON' : 'High Contrast';
    }
    contrastBtn.classList.toggle('active', isHigh);
  }
}

/* ==========================================================================
   3. Text Sizing Controls
   ========================================================================== */
function initTextSizeManager() {
  const sizeBtns = document.querySelectorAll('.size-btn');
  const htmlEl = document.documentElement;

  if (!sizeBtns.length) return;

  const savedSize = localStorage.getItem('thirdeye_text_size') || 'md';
  applyTextSize(savedSize);

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.getAttribute('data-size');
      if (size) {
        applyTextSize(size);
        localStorage.setItem('thirdeye_text_size', size);
      }
    });
  });

  function applyTextSize(size) {
    htmlEl.setAttribute('data-text-size', size);
    sizeBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-size') === size);
    });
  }
}

/* ==========================================================================
   4. Built-in Web Speech API TTS Reader (Listen Aloud)
   ========================================================================== */
function initWebSpeechTTS() {
  const playBtn = document.getElementById('tts-play-btn');
  const stopBtn = document.getElementById('tts-stop-btn');
  const speedSelect = document.getElementById('tts-speed');

  if (!playBtn || !('speechSynthesis' in window)) {
    if (playBtn) {
      playBtn.title = 'Web Speech not supported in this browser';
      playBtn.disabled = true;
    }
    return;
  }

  let isPlaying = false;
  let isPaused = false;
  let speechQueue = [];
  let currentUtteranceIndex = 0;

  function prepareSpeechText() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return [];

    const headingsAndParagraphs = mainContent.querySelectorAll('h2, h3, p, li');
    const texts = [];
    headingsAndParagraphs.forEach(node => {
      const text = node.innerText.trim();
      if (text.length > 0 && !node.closest('.sidebar-toc') && !node.closest('.modal')) {
        texts.push(text);
      }
    });
    return texts;
  }

  function playNextChunk() {
    if (currentUtteranceIndex >= speechQueue.length) {
      stopSpeech();
      return;
    }

    const text = speechQueue[currentUtteranceIndex];
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure rate
    const rate = parseFloat(speedSelect?.value || '1.0');
    utterance.rate = rate;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      currentUtteranceIndex++;
      playNextChunk();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      currentUtteranceIndex++;
      playNextChunk();
    };

    window.speechSynthesis.speak(utterance);
  }

  function startSpeech() {
    window.speechSynthesis.cancel();
    speechQueue = prepareSpeechText();
    currentUtteranceIndex = 0;

    if (speechQueue.length === 0) return;

    isPlaying = true;
    isPaused = false;
    updateUIState('playing');
    playNextChunk();
  }

  function pauseSpeech() {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      isPaused = true;
      updateUIState('paused');
    }
  }

  function resumeSpeech() {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      isPaused = false;
      updateUIState('playing');
    }
  }

  function stopSpeech() {
    window.speechSynthesis.cancel();
    isPlaying = false;
    isPaused = false;
    currentUtteranceIndex = 0;
    updateUIState('stopped');
  }

  function updateUIState(state) {
    if (!playBtn || !stopBtn) return;

    if (state === 'playing') {
      playBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        <span>Pause</span>
      `;
      stopBtn.disabled = false;
    } else if (state === 'paused') {
      playBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span>Resume</span>
      `;
      stopBtn.disabled = false;
    } else {
      playBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span>Listen</span>
      `;
      stopBtn.disabled = true;
    }
  }

  playBtn.addEventListener('click', () => {
    if (!isPlaying) {
      startSpeech();
    } else if (isPlaying && !isPaused) {
      pauseSpeech();
    } else if (isPlaying && isPaused) {
      resumeSpeech();
    }
  });

  stopBtn?.addEventListener('click', stopSpeech);

  speedSelect?.addEventListener('change', () => {
    if (isPlaying && !isPaused) {
      // Re-trigger current chunk with updated speed
      window.speechSynthesis.cancel();
      playNextChunk();
    }
  });

  window.addEventListener('beforeunload', () => {
    window.speechSynthesis.cancel();
  });
}

/* ==========================================================================
   5. Search Engine & Keyword Highlighting
   ========================================================================== */
function initSearchEngine() {
  const searchInput = document.getElementById('policy-search');
  const clearBtn = document.getElementById('clear-search');
  const countEl = document.getElementById('search-result-count');
  const contentBody = document.getElementById('main-content');

  if (!searchInput || !contentBody) return;

  let debounceTimer;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = searchInput.value.trim();
      if (clearBtn) clearBtn.classList.toggle('hidden', query.length === 0);
      performSearch(query);
    }, 250);
  });

  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    performSearch('');
    searchInput.focus();
  });

  function performSearch(query) {
    // Remove previous marks
    removeHighlights(contentBody);

    if (!query || query.length < 2) {
      if (countEl) countEl.textContent = '';
      return;
    }

    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    let matchCount = 0;

    function highlightTextNodes(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (regex.test(text)) {
          const frag = document.createDocumentFragment();
          let lastIndex = 0;
          text.replace(regex, (match, p1, offset) => {
            const before = text.slice(lastIndex, offset);
            if (before) frag.appendChild(document.createTextNode(before));

            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.textContent = match;
            frag.appendChild(mark);

            matchCount++;
            lastIndex = offset + match.length;
          });
          const remaining = text.slice(lastIndex);
          if (remaining) frag.appendChild(document.createTextNode(remaining));

          node.parentNode.replaceChild(frag, node);
        }
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        !['SCRIPT', 'STYLE', 'BUTTON', 'INPUT'].includes(node.tagName)
      ) {
        Array.from(node.childNodes).forEach(highlightTextNodes);
      }
    }

    highlightTextNodes(contentBody);

    if (countEl) {
      if (matchCount > 0) {
        countEl.textContent = `Found ${matchCount} match${matchCount === 1 ? '' : 'es'} for "${query}".`;
        // Scroll first match into view
        const firstMark = contentBody.querySelector('mark.search-highlight');
        firstMark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        countEl.textContent = `No matches found for "${query}".`;
      }
    }
  }

  function removeHighlights(container) {
    const marks = container.querySelectorAll('mark.search-highlight');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/* ==========================================================================
   6. Table of Contents ScrollSpy
   ========================================================================== */
function initTableOfContentsSpy() {
  const tocLinks = document.querySelectorAll('.toc-nav a');
  const sections = document.querySelectorAll('.policy-section');

  if (!tocLinks.length || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        tocLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-80px 0px -60% 0px',
    threshold: 0
  });

  sections.forEach(sec => observer.observe(sec));
}

/* ==========================================================================
   7. Modal Manager (Data Deletion Request)
   ========================================================================== */
function initModalManager() {
  const modal = document.getElementById('deletion-modal');
  const openBtn = document.getElementById('modal-delete-trigger');
  const openEmailBtn = document.getElementById('open-email-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const backdrop = document.getElementById('modal-backdrop');

  if (!modal) return;

  function openModal() {
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('user-email-input')?.focus();
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  openBtn?.addEventListener('click', openModal);
  openEmailBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   8. Print Support
   ========================================================================== */
function initPrintSupport() {
  const printBtn = document.getElementById('print-btn');
  printBtn?.addEventListener('click', () => {
    window.print();
  });
}
