export interface MenuM {
  id?: any;
  companyID: number;
  menuName: string;
  parentMenuId?: any;
  url?: string;
  isActive?: boolean;
  icon?: string;
  permissionsKey?: string[];
  postBy?: string;
}

export interface MenuItemM {
  id: any;
  label: string;
  icon?: string;
  route?: string;
  parentMenuId?: any;
  children?: MenuItemM[];
}