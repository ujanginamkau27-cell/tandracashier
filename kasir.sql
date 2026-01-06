-- Tabel Obat
create table obat (
  id uuid default gen_random_uuid() primary key,
  barcode text unique,
  nama_obat text,
  harga int8,
  stok int4,
  created_at timestamp with time zone default now()
);

-- Tabel Transaksi
create table transaksi (
  id uuid default gen_random_uuid() primary key,
  total_bayar int8,
  item_list jsonb,
  created_at timestamp with time zone default now()
);