/** Firestore `partnerReservations/{id}` */

export type PartnerReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PartnerReservationSource = "web" | "app";

export type PartnerReservationCreateInput = {
  customerName: string;
  customerPhone: string;
  partnerId: string;
  partnerName: string;
  partnerRegion: string;
  partnerAddress: string;
  partnerPhone: string;
  /** YYYY-MM-DD */
  preferredDate: string;
  /** 10:00 | 11:00 | 13:00 | 14:00 | 15:00 | 16:00 */
  preferredTime: string;
  partOrOrder?: string;
  memo?: string;
  source: PartnerReservationSource;
};

export type PartnerReservation = PartnerReservationCreateInput & {
  id: string;
  uid?: string;
  partOrOrder: string;
  memo: string;
  status: PartnerReservationStatus;
  createdAt: string | null;
  updatedAt: string | null;
  adminNote?: string;
};
