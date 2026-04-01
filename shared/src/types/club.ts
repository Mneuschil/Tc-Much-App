export interface Club {
  id: string;
  name: string;
  clubCode: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  address: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClubSettings {
  clubId: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
  website: string | null;
  address: string | null;
}
