export interface UserM {
  id?: number;
  companyID: number;
  username: string;
  password: string;
  isActive?: boolean;
  menuPermissions?: MenuPermissionM[];
}

export interface MenuPermissionM {
  id?: number;
  menuName: string;
  parentMenuId?: any;
  isSelected?: boolean;
  permissionsKey?: PermissionOptionM[];
  children?: MenuPermissionM[];
}

export interface PermissionOptionM {
  key: string;
  value: string;
}