import { initialProducts, initialTransactions } from './data.js';
import { generateTransactionId } from './utils.js';

const DATABASE_KEY = 'famello_database_v1';
const LEGACY_KEYS = {
  products: 'famello_products',
  transactions: 'famello_transactions',
  cart: 'famello_cart',
  initialized: 'famello_initialized'
};

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Data ${label} tidak dapat dibaca. Periksa penyimpanan browser atau reset data dari halaman Produk.`);
  }
}

function readLegacy(key, fallback) {
  const value = localStorage.getItem(key);
  return value === null ? fallback : parseJson(value, key);
}

function readDatabase() {
  const value = localStorage.getItem(DATABASE_KEY);
  if (value === null) {
    initStore();
    return readDatabase();
  }

  const database = parseJson(value, 'kasir');
  if (!database || !Array.isArray(database.products) || !Array.isArray(database.transactions) || !Array.isArray(database.cart)) {
    throw new Error('Struktur data kasir tidak valid. Reset data dari halaman Produk untuk memulihkan data contoh.');
  }

  let migrated = database.version !== 2;
  if (migrated) database.version = 2;
  if (database.members === undefined) {
    database.members = [];
    migrated = true;
  } else if (!Array.isArray(database.members)) {
    throw new Error('Data member tidak valid. Periksa penyimpanan browser.');
  }
  if (database.settings === undefined) {
    database.settings = { taxRate: 0, taxConfigured: false };
    migrated = true;
  } else if (!database.settings || !Number.isFinite(database.settings.taxRate) || database.settings.taxRate < 0 || database.settings.taxRate > 100) {
    throw new Error('Pengaturan pajak tidak valid. Periksa penyimpanan browser.');
  }
  if (database.settings.taxConfigured === undefined) {
    database.settings.taxConfigured = false;
    migrated = true;
  } else if (typeof database.settings.taxConfigured !== 'boolean') {
    throw new Error('Status pengaturan pajak tidak valid. Periksa penyimpanan browser.');
  }
  if (migrated) writeDatabase(database);

  return database;
}

function writeDatabase(database) {
  localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
}

export function initStore() {
  if (localStorage.getItem(DATABASE_KEY) !== null) return;

  const hasLegacyData = Object.values(LEGACY_KEYS).some(key => localStorage.getItem(key) !== null);
  const database = hasLegacyData
    ? {
        version: 2,
        products: readLegacy(LEGACY_KEYS.products, initialProducts),
        transactions: readLegacy(LEGACY_KEYS.transactions, initialTransactions),
        cart: readLegacy(LEGACY_KEYS.cart, []).map(item => ({
          productId: item.productId,
          qty: Number(item.qty)
        })),
        members: [],
        settings: { taxRate: 0, taxConfigured: false }
      }
    : {
        version: 2,
        products: initialProducts,
        transactions: initialTransactions,
          cart: [],
          members: [],
          settings: { taxRate: 0, taxConfigured: false }
      };

  if (!Array.isArray(database.products) || !Array.isArray(database.transactions) || !Array.isArray(database.cart)) {
    throw new Error('Data lama tidak valid. Reset data browser sebelum melanjutkan.');
  }

  writeDatabase(database);
}

export function getProducts() {
  return readDatabase().products;
}

export function getProductById(id) {
  return getProducts().find(product => product.id === id) || null;
}

export function saveProducts(products) {
  const database = readDatabase();
  database.products = products;
  writeDatabase(database);
}

export function addProduct(product) {
  const database = readDatabase();
  if (database.products.some(item => item.id === product.id)) {
    throw new Error('ID produk sudah digunakan.');
  }
  database.products.push(product);
  writeDatabase(database);
  return product;
}

export function updateProduct(id, updates) {
  const database = readDatabase();
  const index = database.products.findIndex(product => product.id === id);
  if (index === -1) return null;
  const reserved = database.cart.find(item => item.productId === id);
  if (reserved && updates.stock < reserved.qty) {
    throw new Error('Stok tidak dapat dibuat lebih rendah dari jumlah produk di keranjang.');
  }
  database.products[index] = { ...database.products[index], ...updates };
  writeDatabase(database);
  return database.products[index];
}

export function deleteProduct(id) {
  const database = readDatabase();
  database.products = database.products.filter(product => product.id !== id);
  database.cart = database.cart.filter(item => item.productId !== id);
  writeDatabase(database);
}

export function updateStock(id, quantitySold) {
  const database = readDatabase();
  const product = database.products.find(item => item.id === id);
  if (!product || !Number.isInteger(quantitySold) || quantitySold < 0 || product.stock < quantitySold) return false;
  product.stock -= quantitySold;
  writeDatabase(database);
  return true;
}

export function getCart() {
  const database = readDatabase();
  return database.cart.flatMap(item => {
    const product = database.products.find(entry => entry.id === item.productId);
    return product ? [{ ...product, productId: product.id, qty: item.qty }] : [];
  });
}

export function saveCart(cart) {
  const database = readDatabase();
  database.cart = cart.map(item => ({ productId: item.productId, qty: Number(item.qty) }));
  writeDatabase(database);
}

export function addToCart(productId) {
  const database = readDatabase();
  const product = database.products.find(item => item.id === productId);
  if (!product || product.stock < 1) return null;

  const item = database.cart.find(entry => entry.productId === productId);
  if (item) {
    if (item.qty >= product.stock) return null;
    item.qty += 1;
  } else {
    database.cart.push({ productId, qty: 1 });
  }

  writeDatabase(database);
  return getCart();
}

export function removeFromCart(productId) {
  const database = readDatabase();
  database.cart = database.cart.filter(item => item.productId !== productId);
  writeDatabase(database);
  return getCart();
}

export function updateCartQty(productId, quantity) {
  const database = readDatabase();
  const product = database.products.find(item => item.id === productId);
  const item = database.cart.find(entry => entry.productId === productId);
  const qty = Number(quantity);

  if (!product || !item || !Number.isInteger(qty)) return null;
  if (qty <= 0) {
    database.cart = database.cart.filter(entry => entry.productId !== productId);
  } else {
    if (qty > product.stock) return null;
    item.qty = qty;
  }

  writeDatabase(database);
  return getCart();
}

export function clearCart() {
  const database = readDatabase();
  database.cart = [];
  writeDatabase(database);
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function getTransactions() {
  return readDatabase().transactions;
}

export function getMembers() {
  return readDatabase().members;
}

function normalizePhone(phone) {
  return String(phone).replace(/\D/g, '');
}

function validateMemberDetails(database, { name, phone, email }, currentMemberId = null) {
  const cleanName = String(name || '').trim();
  const cleanPhone = String(phone || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = normalizePhone(cleanPhone);

  if (!cleanName || cleanName.length > 80) throw new Error('Nama wajib diisi dan maksimal 80 karakter.');
  if (!/^\+?[\d\s()-]+$/.test(cleanPhone) || normalizedPhone.length < 8 || normalizedPhone.length > 15) {
    throw new Error('Masukkan nomor telepon yang valid (8–15 digit).');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 120) {
    throw new Error('Masukkan alamat email yang valid.');
  }
  if (database.members.some(member => member.id !== currentMemberId && normalizePhone(member.phone) === normalizedPhone)) {
    throw new Error('Nomor telepon sudah terdaftar sebagai member.');
  }
  if (database.members.some(member => member.id !== currentMemberId && member.email.toLowerCase() === cleanEmail)) {
    throw new Error('Email sudah terdaftar sebagai member.');
  }

  return { cleanName, cleanPhone, cleanEmail };
}

export function addMember({ name, phone, email }) {
  const database = readDatabase();
  const { cleanName, cleanPhone, cleanEmail } = validateMemberDetails(database, { name, phone, email });
  const member = {
    id: `MBR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    completedPurchases: 0,
    createdAt: new Date().toISOString()
  };
  database.members.unshift(member);
  writeDatabase(database);
  return member;
}

export function updateMember(id, updates) {
  const database = readDatabase();
  const member = database.members.find(entry => entry.id === id);
  if (!member) return null;

  const { cleanName, cleanPhone, cleanEmail } = validateMemberDetails(database, updates, id);
  member.name = cleanName;
  member.phone = cleanPhone;
  member.email = cleanEmail;
  writeDatabase(database);
  return member;
}

export function deleteMember(id) {
  const database = readDatabase();
  const index = database.members.findIndex(member => member.id === id);
  if (index === -1) return false;
  database.members.splice(index, 1);
  writeDatabase(database);
  return true;
}

export function getMemberDiscountRate(member) {
  return member ? Math.min(7.5, 2.5 + (member.completedPurchases || 0) * 0.5) : 0;
}

export function getSettings() {
  return readDatabase().settings;
}

export function saveTaxRate(taxRate) {
  const rate = Number(taxRate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new Error('PPN harus berupa angka antara 0 dan 100 persen.');
  }
  const database = readDatabase();
  database.settings.taxRate = rate;
  database.settings.taxConfigured = true;
  writeDatabase(database);
  return database.settings;
}

export function getTransactionById(id) {
  return getTransactions().find(transaction => transaction.id === id) || null;
}

export function createTransaction(paymentMethod, cashReceived = null, memberId = null) {
  const database = readDatabase();
  const allowedMethods = ['cash', 'qris', 'card'];
  if (!allowedMethods.includes(paymentMethod)) {
    throw new Error('Metode pembayaran tidak dikenal.');
  }
  if (database.cart.length === 0) {
    throw new Error('Keranjang masih kosong.');
  }

  const items = database.cart.map(cartItem => {
    const product = database.products.find(item => item.id === cartItem.productId);
    if (!product) throw new Error('Ada produk di keranjang yang sudah tidak tersedia. Periksa kembali keranjang.');
    if (!Number.isInteger(cartItem.qty) || cartItem.qty < 1 || cartItem.qty > product.stock) {
      throw new Error(`Stok ${product.name} tidak mencukupi. Perbarui jumlah di keranjang.`);
    }

    return {
      productId: product.id,
      name: product.name,
      size: product.size,
      price: product.price,
      qty: cartItem.qty,
      subtotal: product.price * cartItem.qty
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const member = memberId ? database.members.find(entry => entry.id === memberId) : null;
  if (memberId && !member) throw new Error('Member tidak ditemukan. Pilih ulang member sebelum pembayaran.');
  const discountRate = getMemberDiscountRate(member);
  const discountAmount = Math.round(subtotal * discountRate / 100);
  const taxRate = database.settings.taxRate;
  const taxAmount = Math.round((subtotal - discountAmount) * taxRate / 100);
  const total = subtotal - discountAmount + taxAmount;
  const received = paymentMethod === 'cash' ? Number(cashReceived) : null;
  if (paymentMethod === 'cash' && (!Number.isSafeInteger(received) || received < total)) {
    throw new Error('Uang kurang. Masukkan uang yang cukup untuk melanjutkan.');
  }

  const transaction = {
    id: generateTransactionId(),
    date: new Date().toISOString(),
    items,
    subtotal,
    memberId: member?.id || null,
    memberName: member?.name || null,
    discountRate,
    discountAmount,
    taxRate,
    taxAmount,
    total,
    paymentMethod,
    cashReceived: received,
    change: paymentMethod === 'cash' ? received - total : null
  };

  for (const item of items) {
    const product = database.products.find(entry => entry.id === item.productId);
    product.stock -= item.qty;
  }
  if (member) member.completedPurchases = (member.completedPurchases || 0) + 1;
  database.transactions.unshift(transaction);
  database.cart = [];
  writeDatabase(database);
  return transaction;
}

export function clearTransactions() {
  const database = readDatabase();
  database.transactions = [];
  writeDatabase(database);
}

export function getTodayStats() {
  const today = new Date().toLocaleDateString('sv-SE');
  const transactions = getTransactions().filter(transaction =>
    transaction.date && new Date(transaction.date).toLocaleDateString('sv-SE') === today
  );
  const products = getProducts();

  return {
    totalSales: transactions.reduce((sum, transaction) => sum + transaction.total, 0),
    transactionCount: transactions.length,
    lowStockCount: products.filter(product => product.stock <= 5).length,
    totalProducts: products.length
  };
}

export function getMonthlyRevenue() {
  const month = new Date().toLocaleDateString('sv-SE').slice(0, 7);
  return getTransactions()
    .filter(transaction => transaction.date && new Date(transaction.date).toLocaleDateString('sv-SE').slice(0, 7) === month)
    .reduce((sum, transaction) => sum + transaction.total, 0);
}

export function resetStore() {
  localStorage.removeItem(DATABASE_KEY);
  Object.values(LEGACY_KEYS).forEach(key => localStorage.removeItem(key));
  initStore();
}
