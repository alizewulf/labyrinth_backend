export interface DoctorScheduleException {
  id: number;
  doctor_id: number;
  date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
}
