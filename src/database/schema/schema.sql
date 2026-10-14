CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    birthdate DATE,
    phone VARCHAR(30) NOT NULL,
    city VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL,
    experience_type VARCHAR(10) NOT NULL
        CHECK (experience_type IN ('month', 'year')),
    experience INTEGER NOT NULL
        CHECK (experience >= 0),
    avatar_url TEXT,
    avatar_public_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE doctor_reviews (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL
        CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE doctor_schedules (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL
        CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (end_time > start_time)
);

CREATE TABLE doctor_schedule_exceptions (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    start_time TIME,
    end_time TIME,
    CHECK (
        (is_available = FALSE AND start_time IS NULL AND end_time IS NULL)
        OR
        (is_available = TRUE AND start_time IS NOT NULL
         AND end_time IS NOT NULL AND end_time > start_time)
    )
);

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'accepted',
                'rejected',
                'completed',
                'cancelled'
            )
        ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (ends_at > starts_at)
);

CREATE INDEX idx_doctor_schedules_doctor_day
    ON doctor_schedules (doctor_id, day_of_week);

CREATE INDEX idx_schedule_exceptions_doctor_date
    ON doctor_schedule_exceptions (doctor_id, date);

CREATE INDEX idx_appointments_doctor_start
    ON appointments (doctor_id, starts_at);

CREATE INDEX idx_appointments_patient
    ON appointments (patient_id);
