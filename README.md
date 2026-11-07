# SubText (ST//)

A lightweight, distraction-free Chrome extension to preview, copy, and download clean YouTube subtitles and auto-captions in `.txt` or `.srt` formats.

Designed with a utilitarian monochrome aesthetic and JetBrains Mono. Operates 100% locally in your browser with no tracking, external servers, or API keys required.

---

## Downloads

Pre-built binaries are available both in the repository [`releases/`](releases/) directory and on the [GitHub Releases](https://github.com/HadesIsOff/subtext/releases) page:

- **CRX Package**: [`releases/subtext-v1.0.0.crx`](releases/subtext-v1.0.0.crx) (Direct drag-and-drop installer)
- **ZIP Archive**: [`releases/subtext-v1.0.0.zip`](releases/subtext-v1.0.0.zip) (Unpack and load via Developer Mode)

---

## Key Capabilities

- **In-Page Action Button**: Injects a native `[Subtitles]` pill directly into the YouTube player action bar next to Like and Share for one-click `.txt` downloads.
- **Auto-Translation to English**: When viewing videos in Hindi, Spanish, Japanese, German, or other languages, SubText automatically queries YouTube's translation engine (`&tlang=en`) to deliver English transcripts on demand.
- **Innertube Android Engine**: Bypasses YouTube's recent desktop web player protections (`&exp=xpe` and cryptographic `poToken` checks) that cause older downloaders and scrapers to receive empty 0-byte responses.
- **Multiple Export Formats**:
  - `prose` (`.txt`): Flowing sentence paragraphs without awkward line breaks. Ideal for reading, archiving, or feeding into LLMs.
  - `lines` (`.txt`): Individual spoken subtitle segments separated line-by-line.
  - `timed` (`.txt`): Text prefixed with millisecond-accurate `[HH:MM:SS]` timestamps.
  - `subrip` (`.srt`): Standard SubRip subtitle format compatible with Premiere, DaVinci Resolve, VLC, and video players.
- **Live Monospace Terminal Preview**: Real-time preview with word count, character count, and segment metrics.
- **One-Click Clipboard Copy**: Copies formatted transcripts to your clipboard with instant visual confirmation.

---

## Installation

### Option 1: CRX Drag-and-Drop (Fastest)

1. Download [`subtext-v1.0.0.crx`](releases/subtext-v1.0.0.crx).
2. Open Google Chrome (or Brave, Microsoft Edge, Opera, Vivaldi).
3. Navigate to `chrome://extensions` in your address bar.
4. Enable the **Developer mode** toggle in the top-right corner.
5. Drag and drop the downloaded `.crx` file directly into the `chrome://extensions` page.
6. Click **Add extension** when prompted.

---

### Option 2: Developer Mode (Load Unpacked)

1. Download and extract [`subtext-v1.0.0.zip`](releases/subtext-v1.0.0.zip) (or clone this repository):
   ```bash
   git clone https://github.com/HadesIsOff/subtext.git
   ```
2. Navigate to `chrome://extensions` in your browser.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** (top-left).
5. Select the extracted folder containing `manifest.json`.

---

## Technical Architecture

```text
[ YouTube Watch Page ]
        │
        ├── In-Tab Context (world: MAIN)
        │     ├── Reads window.ytcfg.INNERTUBE_API_KEY
        │     └── Queries https://www.youtube.com/youtubei/v1/player
        │           ├── Context: { client: { clientName: "ANDROID" } }
        │           └── Video ID: targetId
        │
        ├── Subtitle Resolution
        │     ├── Native English Track (en / a.en)
        │     └── Auto-Translated Stream (&tlang=en) if source is non-English
        │
        └── Parser & Formatter
              ├── XML TimedText Parser (<p t="..." d="...">)
              ├── HTML Entity Cleaner
              └── Format Generators: Prose, Lines, Timed, SRT
```

Older scrapers fetch `ytInitialPlayerResponse` from the desktop web HTML and query raw `timedtext` URLs, which now return HTTP 200 with `Content-Length: 0` unless signed with a valid browser `poToken`. 

SubText executes its queries natively through YouTube's internal Innertube Android client context from within your active browser tab. This leverages your authenticated browser session and avoids silent 0-byte drops.

---

## Repository Structure

```text
subtext/
├── manifest.json       # Manifest V3 extension configuration
├── popup.html          # JetBrains Mono technical layout
├── popup.css           # Minimalist dark theme styles and spring transitions
├── popup.js            # Innertube controller, XML parser, and download handlers
├── content.js          # In-page YouTube button injector
├── content.css         # YouTube dark-mode integrated button styles
├── icon16.png          # 16x16 toolbar icon
├── icon48.png          # 48x48 extensions manager icon
├── icon128.png         # 128x128 store display icon
├── pack.ps1            # Release packaging script
├── releases/           # Pre-compiled CRX and ZIP distribution files
│   ├── subtext-v1.0.0.crx
│   └── subtext-v1.0.0.zip
└── README.md           # Documentation
```

---

## Building from Source

To package a fresh `.zip` and `.crx`:

1. Run the packaging script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\pack.ps1
   ```
2. To compile a signed `.crx` file:
   ```powershell
   chrome.exe --pack-extension="<path-to-folder>"
   ```

---

## License

MIT License. Free to use, modify, and distribute.
