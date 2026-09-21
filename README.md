#  Your Life, In Receipts

An interactive digital storytelling engine that correlates heterogeneous personal data traces (Spotify History, Household Expenses, UPI Transactions) into unified, thermal receipt-styled narratives.

##  Architectural Decisions & Tech Stack
- **Zero-Bundle Overhead Architecture:** Built with pure ES6+ Vanilla JavaScript to eliminate frame render delays and keep memory footprint minimal.
- **Dynamic Connection Engine:** Vector-based quadratic Bezier curve SVG engine calculating absolute spatial screen coordinates (`d="M x1 y1 Q..."`) dynamically across scroll viewports.
- **Data Engine & Normalization:** Asynchronous, multi-threaded PapaParse parsing pipeline with robust ISO date normalization and dynamic column-header mapping.
- **Styling:** Dynamic Tailwind CSS combined with keyframe CSS animations for simulated thermal paper aesthetic.

##  Key Features
1. **Multi-Source Data Synergy:** Correlates listening history with expenses and digital transactions.
2. **Context-Aware Visualizer:** Hover over any card to uncover spatial/time-based connections using dynamic vector connections.
3. **Filtering & Modes:** Late Night Mode (00:00 - 05:00 hrs filter), Multi-category isolation, and Instant Search.
4. **Analytics Bar:** Live summary metrics for financial and behavioral data traces.


## 🏆 Hackathon Achievement

Secured **Rank #181** in **WEB RUSH 2026** (6-Hour Frontend Hackathon by Frontend Arena).

![Web Rush 2026 Certificate](<img width="1600" height="1120" alt="certificate" src="https://github.com/user-attachments/assets/fd584ffa-a053-4dac-a3b6-a3dba111bca5" />)

