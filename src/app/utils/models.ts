export interface AboutM {
  id?: number;
  companyID: number;
  heading?: string | null;
  title?: string | null;
  description?: string | null;
  title2?: string | null;
  description2?: string | null;
  title3?: string | null;
  description3?: string | null;
  title4?: string | null;
  description4?: string | null;
  title5?: string | null;
  description5?: string | null;
  title6?: string | null;
  description6?: string | null;
  title7?: string | null;
  description7?: string | null;
  title8?: string | null;
  description8?: string | null;
  imageUrl?: string | null;
}

export interface ContactM {
  id?: number;
  companyID: number;
  address1?: string | null;
  address2?: string | null;
  phoneNumber1?: string | null;
  phoneNumber2?: string | null;
  phoneNumber3?: string | null;
  email?: string | null;
  facebookLink?: string | null;
  othersLink1?: string | null;
  othersLink2?: string | null;
}

export interface CarouselM {
    id: string;
    companyID: number;
    title: string;
    description: string;
    imageUrl: any;
}

export interface ProductM {
    id?: any;
    companyID: number;
    title: string;
    description: string;
    imageUrl: string;
    itemId: any;
    itemDescription: string;
    brand: string;
    model: string;
    origin: string;
    additionalInformation: string;
    specialFeature: string;
    catalogURL: string;
    sl: number;
    images: any[];
    relatedProducts: any[];
}

export interface MenuM {
  id: number;
  menuName: string;
  parentMenuId?: any;
  url?: string;
  isActive: boolean;
  icon?: string;
  permissionsKey: string[];
  postBy: string;
}

export interface ItemM {
  id?: number;
  companyID: number;
  slItem?: number | null;
  description?: string | null;
  createdDate?: Date;
  updatedDate?: Date;
}

export interface ContactFormM {
  name: string;
  email: string;
  subject: string;
  message: string;
  toEmail: string;
}
