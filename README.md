# FAMELLO STUDIO

Kasir parfum berbasis Astro dengan katalog, pembayaran simulasi, pengelolaan stok, struk, dan riwayat transaksi.

## Menjalankan aplikasi

```sh
npm install
npm run dev
```

Saat website dibuka, login menggunakan username dan password. Peran dikenali otomatis dari akun:

- Kasir: username `kasir`, password `6767`.
- Manager: username `manager`, password `676767`.

Kasir diarahkan ke halaman transaksi. Manager dapat membuka ringkasan omzet, riwayat transaksi, serta pengelolaan produk, harga, dan stok. Login ini hanya demo sisi browser: akun dan data tidak dilindungi server, jadi jangan gunakan untuk informasi sensitif atau produksi.

Build statis untuk produksi:

```sh
npm run build
npm run preview
```

## Data dan penyimpanan

- `src/data/db.json` berisi katalog contoh dan transaksi awal.
- Produk, keranjang, stok, transaksi, member, dan tarif PPN disimpan di browser dengan kunci `famello_database_v1`.
- Data tersedia di profil browser yang sama, bukan untuk berbagi antarperangkat. Tombol **Reset data contoh** di halaman Produk memulihkan katalog dan menghapus transaksi lokal.
- Diskon member mulai 2,5%, naik 0,5 poin setelah setiap transaksi member berhasil, dan dibatasi maksimum 7,5%. Tarif PPN dapat diatur manager; awalnya 0%.
- QRIS dan debit/kredit adalah simulasi lokal. Tidak ada koneksi bank atau pemrosesan pembayaran sungguhan. Login juga hanya demo browser, bukan perlindungan data produksi.
- Foto katalog dimuat dari Unsplash; jika foto tidak tersedia, kartu menampilkan bidang foto cadangan.

## Struktur

```text
src/
  data/
    db.json
  layouts/
    MainLayout.astro
  lib/
    data.js
    store.js
    utils.js
  pages/
    index.astro
    kasir.astro
    manager.astro
    member.astro
    pembayaran.astro
    produk.astro
    riwayat.astro
    struk.astro
  styles/
    global.css
```
