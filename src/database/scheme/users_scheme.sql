create table users (
	id SERIAL primary key ,
	name varchar(100) not null,
	surname varchar(100) not null, 
	birthdate DATE not null,
	phone varchar(30) not null,
	city varchar(50) not null,
	email varchar(255) unique not null,
	role VARCHAR(20) not null default 'user',
	password_hash text not null,
	created_at TIMESTAMP not null DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP not null default current_timestamp
)
