const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function money(cents) {
  return currency.format(cents / 100);
}

async function loadState() {
  const [orderResponse, refundsResponse] = await Promise.all([fetch('/api/order'), fetch('/api/refunds')]);
  const order = await orderResponse.json();
  const refunds = await refundsResponse.json();
  document.querySelector('[data-testid="paid"]').textContent = money(order.paid);
  document.querySelector('[data-testid="refunded"]').textContent = money(order.refunded);
  document.querySelector('[data-testid="remaining"]').textContent = money(order.refundableRemaining);
  const list = document.querySelector('#refunds');
  list.replaceChildren(...(refunds.length ? refunds.map((refund) => {
    const item = document.createElement('li');
    item.textContent = `${money(refund.amount)} · ${refund.status} · card ${money(refund.allocation.card)} · credit ${money(refund.allocation.credit)}`;
    return item;
  }) : [Object.assign(document.createElement('li'), { textContent: 'No refunds requested.' })]));
  return order;
}

async function requestRefund(amount) {
  const response = await fetch('/api/refunds', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
    body: JSON.stringify({ amount }),
  });
  const result = await response.json();
  document.querySelector('#result').textContent = response.ok
    ? `Refund ${result.id} submitted for ${money(result.amount)}. Status: ${result.status}.`
    : result.error;
  await loadState();
}

document.querySelector('#refund-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = Number.parseFloat(new FormData(event.currentTarget).get('amount'));
  await requestRefund(Math.round(value * 100));
});

document.querySelector('#full-refund').addEventListener('click', async () => {
  const order = await loadState();
  await requestRefund(order.refundableRemaining);
});

await loadState();
