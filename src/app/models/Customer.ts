export interface CustomerM {
  id?: number;
  name: string | null;
  address?: string | null;
  mobileNo?: string | null;
  areaId?: number | undefined;
  areaName?: string | undefined;
  messageStatus?: number | undefined;
  valid?: number | undefined;
  pno?: number | undefined;
  userName?: string | null;
  entryDate?: string | null;
}

export interface AreaM {
  id?: number;
  name: string | null;
}