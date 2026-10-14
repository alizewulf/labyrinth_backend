export type AppointmentStatus =
  'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  starts_at: Date;
  ends_at: Date;
  status: AppointmentStatus;
  created_at: Date;
  updated_at: Date;
}
