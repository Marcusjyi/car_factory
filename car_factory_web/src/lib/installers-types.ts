export type Installer = {
  id: string;
  name: string;
  region: string;
  address: string;
  phone: string;
  specialties: string[];
  hours: string;
  description: string;
  image: string;
  badges?: string[];
  specialtyLabel?: string;
  ratingAverage?: number;
  ratingCount?: number;
};
