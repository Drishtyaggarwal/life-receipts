/**
 * @fileoverview Application Controller for Digital Life Receipts.
 * Handles DOM lifecycle, multi-facet filtering pipeline, thermal rendering, and analytics computation.
 * @module AppController
 */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('receipts-grid');
  const searchInput = document.getElementById('search-input');
  const nightBtn = document.getElementById('filter-night');

  let activeCategory = 'all';
  let isNightOnly = false;

  // Load datasets via data.js loader function
  loadAllDatasets((data) => {
    applyFilters();
  });

  /**
   * Master Filter Engine Pipeline.
   * Applies category filtering, late-night temporal checks, and text search query matching.
   * @returns {void}
   */
  function applyFilters() {
    if (!lifeReceipts) return;
    let filtered = [...lifeReceipts];

    // 1. Flexible Category Filter Logic
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => {
        const itemType = (item.type || '').toLowerCase();
        const itemCat = (item.category || '').toLowerCase();
        const target = activeCategory.toLowerCase();

        // Check type, category name, or tags flexible match
        if (target === 'transaction' || target === 'upi') {
          return itemType === 'transaction' || itemCat.includes('transaction') || itemCat.includes('upi') || (item.metadata && item.metadata.tags && item.metadata.tags.includes('upi'));
        }
        if (target === 'purchase') {
          return itemType === 'purchase' || itemCat.includes('purchase') || itemCat.includes('shopping');
        }
        if (target === 'music') {
          return itemType === 'music' || itemCat.includes('music') || itemCat.includes('spotify');
        }

        return itemType === target || itemCat.includes(target);
      });
    }

    // 2. Late Night Filter Logic (00:00 - 05:00 UTC)
    if (isNightOnly) {
      filtered = filtered.filter(item => {
        const hr = new Date(item.timestamp).getUTCHours();
        return hr >= 0 && hr < 5;
      });
    }

    // 3. Search Query Filter Logic
    if (searchInput && searchInput.value.trim() !== '') {
      const query = searchInput.value.trim().toLowerCase();
      filtered = filtered.filter(r =>
        (r.title && r.title.toLowerCase().includes(query)) ||
        (r.category && r.category.toLowerCase().includes(query)) ||
        (r.metadata && r.metadata.tags && r.metadata.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    renderCards(filtered);
    updateAnalytics(filtered);
  }

  /**
   * Dynamic Thermal Receipts DOM Grid Renderer.
   * @param {Array<Object>} items - Array of normalized receipt objects to display.
   * @returns {void}
   */
  function renderCards(items) {
    if (!grid) return;
    grid.innerHTML = '';

    if (!items || items.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-20 text-slate-400">No matching receipts found for this selection.</div>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'thermal-receipt p-4 rounded-t-sm receipt-card cursor-pointer flex flex-col justify-between h-48';
      card.dataset.id = item.id;

      const date = new Date(item.timestamp);
      const hrs = date.getUTCHours();
      const mins = date.getUTCMinutes().toString().padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      const formattedHrs = hrs % 12 || 12;
      const timeStr = `${formattedHrs.toString().padStart(2, '0')}:${mins} ${ampm}`;

      const tagsList = (item.metadata && item.metadata.tags) ? item.metadata.tags : [];

      card.innerHTML = `
        <div>
          <div class="flex justify-between items-center text-xs font-bold text-slate-500 mb-2 border-b border-dashed border-slate-300 pb-1">
            <span>${(item.category || '').toUpperCase()}</span>
            <span>${timeStr}</span>
          </div>
          <h3 class="font-bold text-slate-900 text-sm leading-snug line-clamp-2">${item.title || ''}</h3>
        </div>
        <div class="mt-4 pt-2 border-t border-dashed border-slate-300 flex flex-wrap gap-1">
          ${tagsList.map(t => `<span class="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">#${t}</span>`).join('')}
        </div>
      `;

      card.addEventListener('click', () => openInspector(item));
      card.addEventListener('mouseenter', () => highlightConnections(item));
      card.addEventListener('mouseleave', () => clearConnections());

      grid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  /**
   * Inspector Side-Panel Detail Trigger.
   * @param {Object} item - Detailed metadata for chosen receipt item.
   * @returns {void}
   */
  function openInspector(item) {
    const panel = document.getElementById('inspector-panel');
    const content = document.getElementById('inspector-content');

    if (!panel || !content) return;

    const tagsStr = (item.metadata && item.metadata.tags) ? item.metadata.tags.join(', ') : '';

    content.innerHTML = `
      <div class="thermal-receipt p-6 rounded text-slate-900 space-y-4">
        <div class="text-center border-b-2 border-slate-900 pb-3">
          <p class="font-bold text-lg">DIGITAL RECEIPT</p>
          <p class="text-xs text-slate-600">${new Date(item.timestamp).toUTCString()}</p>
        </div>
        <div>
          <p class="text-xs text-slate-500">ACTIVITY</p>
          <p class="font-bold text-base">${item.title || ''}</p>
        </div>
        <div>
          <p class="text-xs text-slate-500">CATEGORY</p>
          <p class="text-sm font-semibold">${item.category || ''}</p>
        </div>
        ${(item.metadata && item.metadata.cost) ? `
        <div>
          <p class="text-xs text-slate-500">AMOUNT</p>
          <p class="text-sm font-bold">₹${item.metadata.cost}</p>
        </div>` : ''}
        <div class="border-t border-dashed border-slate-400 pt-3">
          <p class="text-xs font-bold mb-1">TAGS</p>
          <p class="text-xs font-mono">${tagsStr}</p>
        </div>
      </div>
    `;

    panel.classList.remove('translate-x-full');
  }

  const closeBtn = document.getElementById('close-inspector');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('inspector-panel').classList.add('translate-x-full');
    });
  }

  // Bind Category Buttons
  const filterBtns = [
    { id: 'filter-all', cat: 'all' },
    { id: 'filter-music', cat: 'music' },
    { id: 'filter-purchase', cat: 'purchase' },
    { id: 'filter-upi', cat: 'transaction' }
  ];

  filterBtns.forEach(btnConfig => {
    const btn = document.getElementById(btnConfig.id);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => {
          b.classList.remove('active', 'bg-slate-700', 'text-white');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('active', 'bg-slate-700', 'text-white');
        btn.classList.remove('text-slate-400');

        activeCategory = btnConfig.cat;
        applyFilters();
      });
    }
  });

  // Search Input Listener
  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilters());
  }

  // Late Night Button Listener
  if (nightBtn) {
    nightBtn.addEventListener('click', () => {
      isNightOnly = !isNightOnly;
      nightBtn.classList.toggle('bg-indigo-600', isNightOnly);
      applyFilters();
    });
  }
});

/**
 * Analytics Bar Update Engine.
 * Recalculates metrics for total traces, midnight activities, total financial output, and music logs.
 * @param {Array<Object>} items - Array of currently active/filtered receipt objects.
 * @returns {void}
 */
function updateAnalytics(items) {
  const totalEl = document.getElementById('stat-total');
  const nightEl = document.getElementById('stat-night');
  const spentEl = document.getElementById('stat-spent');
  const musicEl = document.getElementById('stat-music');

  if (!totalEl) return;

  const total = items.length;
  let nightCount = 0;
  let totalCost = 0;
  let musicCount = 0;

  items.forEach(item => {
    // Late Night Check (00:00 - 05:00 UTC)
    const hr = new Date(item.timestamp).getUTCHours();
    if (hr >= 0 && hr < 5) nightCount++;

    // Total Cost Sum
    if (item.metadata && item.metadata.cost) {
      totalCost += parseFloat(item.metadata.cost) || 0;
    }

    // Music Count
    if (item.type === 'music' || (item.category && item.category.toLowerCase() === 'music')) {
      musicCount++;
    }
  });

  totalEl.innerText = total;
  nightEl.innerText = nightCount;
  spentEl.innerText = `₹${Math.round(totalCost).toLocaleString('en-IN')}`;
  musicEl.innerText = musicCount;
}