import { Timestamp } from "firebase/firestore";

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
  timestamp: Timestamp
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string
  favorites: string[];
  disabled?: boolean;
}
