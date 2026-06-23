/**
 * Ask GS — Floating Chat Widget
 * Add this as a JavaScript snippet in Code Snippets (run on: Front End)
 * 
 * Replace TOOLS_URL with your actual Vercel/subdomain URL
 */

(function () {
  const TOOLS_URL = 'https://tools.gettingsmart.com';
  const CHAT_URL  = TOOLS_URL + '/ask';

  // ── Styles ──────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #gs-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #1c7293;
      color: white;
      border: none;
      cursor: pointer;
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(28,114,147,0.35);
      transition: transform 0.2s ease, background 0.15s;
    }
    #gs-chat-btn:hover {
      background: #145670;
      transform: scale(1.05);
    }
    #gs-chat-btn.open {
      background: #145670;
    }
    #gs-chat-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 380px;
      height: 580px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);
      z-index: 99997;
      overflow: hidden;
      display: none;
      flex-direction: column;
      transition: opacity 0.2s ease, transform 0.2s ease;
      opacity: 0;
      transform: translateY(12px);
    }
    #gs-chat-panel.visible {
      display: flex;
      opacity: 1;
      transform: translateY(0);
    }
    #gs-chat-panel iframe {
      width: 100%;
      flex: 1;
      border: none;
    }
    #gs-chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #EFEFEC;
      background: white;
      flex-shrink: 0;
    }
    #gs-chat-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: Georgia, serif;
      font-size: 15px;
      font-style: italic;
      font-weight: 500;
      color: #1A1A18;
    }
    #gs-chat-header-logo {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #gs-chat-header-logo img {
      width: 28px;
      height: 28px;
      display: block;
    }
    #gs-chat-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #6B6A65;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #gs-chat-close:hover { background: #F7F7F5; color: #1A1A18; }

    @media (max-width: 480px) {
      #gs-chat-panel {
        width: calc(100vw - 16px);
        right: 8px;
        bottom: 80px;
        height: 70vh;
      }
    }
  `;
  document.head.appendChild(style);

  // ── Button ───────────────────────────────────────────────────────────────
  const btn = document.createElement('button');
  btn.id = 'gs-chat-btn';
  btn.setAttribute('aria-label', 'Ask GS — Getting Smart Research Assistant');
  btn.innerHTML = `
    <svg id="gs-icon-chat" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="22" height="22">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <svg id="gs-icon-close" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" width="20" height="20" style="display:none">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;
  document.body.appendChild(btn);

  // ── Panel ────────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'gs-chat-panel';
  panel.innerHTML = `
    <div id="gs-chat-header">
      <div id="gs-chat-header-left">
        <div id="gs-chat-header-logo">
          <img src="${TOOLS_URL}/logo-icon-teal.png" alt="Getting Smart">
        </div>
        Ask GS
      </div>
      <button id="gs-chat-close" aria-label="Close chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <iframe id="gs-chat-iframe" src="" title="Ask GS — Getting Smart Research Assistant" allow="clipboard-write"></iframe>
  `;
  document.body.appendChild(panel);

  // ── State ────────────────────────────────────────────────────────────────
  let isOpen = false;
  let iframeLoaded = false;

  function getPageContext() {
    return {
      type:  'gs-page-context',
      url:   window.location.href,
      title: document.title.replace(' | Getting Smart', '').replace(' - Getting Smart', ''),
      path:  window.location.pathname,
    };
  }

  function open() {
    // Track widget open in GA4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ask_gs_widget_open');
    }
    isOpen = true;
    btn.classList.add('open');
    document.getElementById('gs-icon-chat').style.display = 'none';
    document.getElementById('gs-icon-close').style.display = 'block';

    // Load iframe on first open
    const iframe = document.getElementById('gs-chat-iframe');
    if (!iframeLoaded) {
      iframe.src = CHAT_URL;
      iframeLoaded = true;
      iframe.addEventListener('load', () => {
        iframe.contentWindow.postMessage(getPageContext(), '*');
      });
    } else {
      // Re-send context in case page changed
      iframe.contentWindow.postMessage(getPageContext(), '*');
    }

    panel.style.display = 'flex';
    requestAnimationFrame(() => panel.classList.add('visible'));
  }

  function close() {
    isOpen = false;
    btn.classList.remove('open');
    document.getElementById('gs-icon-chat').style.display = 'block';
    document.getElementById('gs-icon-close').style.display = 'none';
    panel.classList.remove('visible');
    setTimeout(() => { if (!isOpen) panel.style.display = 'none'; }, 200);
  }

  btn.addEventListener('click', () => isOpen ? close() : open());
  document.getElementById('gs-chat-close').addEventListener('click', close);

  // Respond to context requests from the iframe
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'gs-request-context') {
      const iframe = document.getElementById('gs-chat-iframe');
      iframe?.contentWindow?.postMessage(getPageContext(), '*');
    }
  });

})();
