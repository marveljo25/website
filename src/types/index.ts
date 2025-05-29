export interface Property {
  id: string;
  kode: number;
  wilayah: string;
  type: string;
  status: string;
  tanggal: string;
  cluster: string;
  hadap: string;
  luasTanah: number;
  luasBangunan: string;
  lantai: number;
  kamarTidur: string;
  kamarMandi: string;
  lain: string;
  legal: string;
  hargaJual: number;
  fee: string;
  listing: string;
  images: string[];
  judul: string;
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  photo_url?: string;
  role: string;
  favorites: string[];
  disabled?: boolean;
}