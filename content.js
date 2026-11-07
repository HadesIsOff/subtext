// SubText - In-Page Content Script
// Injects a minimal one-click subtitle download button into YouTube's action bar
// Pure SVG iconography, zero emojis, silky smooth interactions

(function () {
  const BUTTON_ID = 'subtext-yt-quick-btn';

  function extractVideoId() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('v')) return params.get('v');
    const match = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  function getApiKey() {
    let key = window.ytcfg?.get?.('INNERTUBE_API_KEY');
    if (!key) {
      const match = document.documentElement.innerHTML.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
      key = match ? match[1] : 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
    }
    return key;
  }

  function injectSubtitleButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const actionsRow = 
      document.querySelector('ytd-watch-metadata #actions #top-level-buttons-computed') ||
      document.querySelector('#actions-inner #top-level-buttons-computed') ||
      document.querySelector('#menu #top-level-buttons-computed');

    if (!actionsRow) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'subtext-yt-btn';
    btn.title = 'Extract & Download Subtitles (.txt)';
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="5" y1="10" x2="9" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span class="st-label">Subtitles</span>
    `;

    btn.addEventListener('click', handleQuickDownload);
    actionsRow.appendChild(btn);
  }

  async function handleQuickDownload(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = document.getElementById(BUTTON_ID);
    if (!btn || btn.classList.contains('st-loading')) return;

    const label = btn.querySelector('.st-label');
    const originalText = label.textContent;

    const videoId = extractVideoId();
    if (!videoId) {
      alert('SubText: Could not detect video ID.');
      return;
    }

    try {
      btn.classList.add('st-loading');
      label.textContent = 'Extracting...';

      const apiKey = getApiKey();
      const endpoint = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
      const playerRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '20.10.38',
              hl: 'en',
              gl: 'US'
            }
          },
          videoId: videoId
        })
      });

      if (!playerRes.ok) throw new Error(`Innertube HTTP ${playerRes.status}`);

      const playerData = await playerRes.json();
      const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!captionTracks || captionTracks.length === 0) {
        alert('SubText: No subtitles found for this video.');
        label.textContent = 'No Subtitles';
        btn.classList.remove('st-loading');
        setTimeout(() => { label.textContent = originalText; }, 2000);
        return;
      }

      const nativeEnglish = captionTracks.find(t => t.languageCode === 'en' || t.vssId === 'a.en');
      let targetUrl = '';
      let isTranslated = false;

      if (nativeEnglish) {
        targetUrl = nativeEnglish.baseUrl;
      } else {
        const sourceTrack = captionTracks.find(t => t.vssId?.startsWith('a.')) || captionTracks[0];
        targetUrl = `${sourceTrack.baseUrl}&tlang=en`;
        isTranslated = true;
      }

      const capRes = await fetch(targetUrl);
      const capXml = await capRes.text();

      if (!capXml || capXml.trim().length === 0) {
        throw new Error('Caption stream was empty.');
      }

      const parser = new DOMParser();
      const xml = parser.parseFromString(capXml, 'text/xml');
      const pTags = xml.querySelectorAll('p');
      let lines = [];

      if (pTags.length > 0) {
        lines = Array.from(pTags).map(p => cleanHtml(p.textContent || '').trim()).filter(Boolean);
      } else {
        const textTags = xml.querySelectorAll('text');
        lines = Array.from(textTags).map(t => cleanHtml(t.textContent || '').trim()).filter(Boolean);
      }

      if (lines.length === 0) {
        throw new Error('Parsed captions were empty.');
      }

      const fullText = lines
        .join(' ')
        .replace(/\s+/g, ' ')
        .replace(/([.?!])\s+/g, '$1\n\n')
        .trim();

      const rawTitle = playerData?.videoDetails?.title || document.title.replace(' - YouTube', '');
      const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
      const filename = `${cleanTitle}_${isTranslated ? 'en_translated' : 'subtitles'}.txt`;

      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      btn.classList.remove('st-loading');
      btn.classList.add('st-success');
      label.textContent = isTranslated ? 'Saved EN .txt' : 'Saved .txt';
      setTimeout(() => {
        btn.classList.remove('st-success');
        label.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('SubText download failed:', err);
      btn.classList.remove('st-loading');
      label.textContent = 'Failed';
      setTimeout(() => { label.textContent = originalText; }, 2000);
    }
  }

  function cleanHtml(str) {
    return str
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n/g, ' ')
      .trim();
  }

  window.addEventListener('yt-navigate-finish', () => {
    setTimeout(injectSubtitleButton, 1000);
  });

  setTimeout(injectSubtitleButton, 1500);
  const observer = new MutationObserver(() => {
    if (window.location.pathname.startsWith('/watch') && !document.getElementById(BUTTON_ID)) {
      injectSubtitleButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
