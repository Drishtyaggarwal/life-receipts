function highlightConnections(activeItem) {
  const connectedItems = findConnections(activeItem, lifeReceipts);
  const activeCard = document.querySelector(`[data-id="${activeItem.id}"]`);
  const svg = document.getElementById('svg-canvas');

  if (!activeCard || !svg) return;
  svg.innerHTML = '';

  // Set SVG canvas to full scrollable page size
  const bodyHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
  const bodyWidth = Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth
  );

  svg.setAttribute('width', bodyWidth);
  svg.setAttribute('height', bodyHeight);

  connectedItems.forEach(item => {
    const targetCard = document.querySelector(`[data-id="${item.id}"]`);
    if (targetCard) {
      targetCard.classList.add('connected');
      drawPath(activeCard, targetCard, svg);
    }
  });
}

function clearConnections() {
  document.querySelectorAll('.receipt-card').forEach(c => c.classList.remove('connected'));
  const svg = document.getElementById('svg-canvas');
  if (svg) svg.innerHTML = '';
}

function drawPath(elemA, elemB, svg) {
  const rA = elemA.getBoundingClientRect();
  const rB = elemB.getBoundingClientRect();

  // Calculate coordinates relative to page scroll
  const x1 = rA.left + rA.width / 2 + window.scrollX;
  const y1 = rA.top + rA.height / 2 + window.scrollY;
  const x2 = rB.left + rB.width / 2 + window.scrollX;
  const y2 = rB.top + rB.height / 2 + window.scrollY;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const curveY = (y1 + y2) / 2 - 40;
  const d = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${curveY}, ${x2} ${y2}`;

  path.setAttribute('d', d);
  path.setAttribute('stroke', '#f43f5e');
  path.setAttribute('stroke-width', '2.5');
  path.setAttribute('stroke-dasharray', '5,5');
  path.setAttribute('fill', 'none');

  svg.appendChild(path);
}