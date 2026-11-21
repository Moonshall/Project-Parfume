export function formatCurrency(amount) {
  return `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
}

export function generateTransactionId() {
  const d = new Date();
  const date = d.toLocaleDateString('sv-SE').replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRX-${date}-${rand}`;
}

export function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Tanggal tidak valid';
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak valid';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ' ' + date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Waktu tidak valid';
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function generateProductId(products) {
  const nums = products.map(product => parseInt(product.id.replace('FML', ''), 10)).filter(Number.isFinite);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return 'FML' + String(next).padStart(3, '0');
}

export function validateProduct(data) {
  const errors = [];
  if (!data.name || !data.name.trim()) errors.push('Nama produk wajib diisi.');
  if (!['homme', 'femme', 'unisex'].includes(data.category)) errors.push('Kategori wajib dipilih.');
  if (!data.size || !data.size.trim()) errors.push('Ukuran wajib diisi.');
  if (!Number.isSafeInteger(data.price) || data.price <= 0) errors.push('Harga harus berupa angka bulat lebih dari 0.');
  if (!Number.isInteger(data.stock) || data.stock < 0) errors.push('Stok harus berupa bilangan bulat dan tidak boleh negatif.');
  if (data.name && data.name.trim().length > 80) errors.push('Nama produk maksimal 80 karakter.');
  if (data.size && data.size.trim().length > 20) errors.push('Ukuran maksimal 20 karakter.');
  return errors;
}

export function getQuickAmounts(total) {
  const amounts = [total];
  const roundups = [1000, 5000, 10000, 20000, 50000, 100000];
  for (const r of roundups) {
    const rounded = Math.ceil(total / r) * r;
    if (rounded > total && !amounts.includes(rounded)) {
      amounts.push(rounded);
    }
  }
  return amounts.slice(0, 5);
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export const categoryLabels = {
  all: 'Semua',
  homme: 'Homme',
  femme: 'Femme',
  unisex: 'Unisex'
};

export const paymentMethodLabels = {
  cash: 'Tunai',
  qris: 'QRIS',
  card: 'Debit/Kredit'
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

export function trapDialogFocus(dialog, event) {
  if (event.key !== 'Tab') return;
  const focusable = Array.from(dialog.querySelectorAll(
    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
  )).filter(element => element.getClientRects().length > 0);

  if (focusable.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
