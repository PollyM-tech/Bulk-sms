export interface BaseContact {
  name: string;
  phone: string;
  email?: string;
}

export interface Contact extends BaseContact {
  id: number;
}
