export type ExperienceType = "month" | "year"

export interface Doctor {
    id: number,
    user_id: number,
    specialization: string,
    experience_type: ExperienceType,
    experience: number,
    created_at: Date,
    updated_at: Date
}

export interface DoctorProfile extends Doctor {
    name: string,
    surname: string,
    city: string | null
}