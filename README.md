# Labyrinth Backend

ეს არის NestJS და TypeScript-ზე აგებული backend-სერვისი PostgreSQL მონაცემთა ბაზით. პროექტში რეალიზებულია მომხმარებლის რეგისტრაცია, login JWT access token-ით, მომხმარებლების სიის მიღება და ავტორიზებული მომხმარებლის პროფილის მიღება.

## ტექნოლოგიები

- Node.js და TypeScript
- NestJS 12
- PostgreSQL 17
- `pg` PostgreSQL-თან დასაკავშირებლად
- `bcrypt` პაროლების დასაჰეშად
- Passport და JWT ავტორიზაციისთვის
- Docker Compose

## საჭირო პროგრამები

- Node.js-ის LTS ვერსია და npm
- Docker და Docker Compose

## გაშვება

### 1. დამოკიდებულებების დაყენება

```bash
npm install
```

### 2. გარემოს ცვლადები

პროექტის root საქაღალდეში შექმენით `.env` ფაილი:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=labyrinth
DB_USER=labyrinth
DB_PASSWORD=labyrinth
JWT_SECRET=change-me
```

`DB_*` მნიშვნელობები უნდა ემთხვეოდეს `docker-compose.yml`-ში მითითებულ PostgreSQL-ის პარამეტრებს. `JWT_SECRET` გამოიყენება JWT token-ების ხელმოსაწერად და აუცილებელია ავტორიზაციისთვის. `PORT` არჩევითია; მისი არქონის შემთხვევაში აპლიკაცია გაეშვება `3000` პორტზე.

### 3. PostgreSQL-ის გაშვება

```bash
docker compose up -d postgres
docker compose ps
```

Docker Compose მხოლოდ PostgreSQL-ს რთავს. `users` ცხრილი ცალკე შექმენით SQL-ფაილიდან:

```bash
docker compose exec -T postgres psql -U labyrinth -d labyrinth \
  < src/database/scheme/users_scheme.sql
```

ახალი Docker volume-ის შემთხვევაში ეს ბრძანება ერთხელ უნდა შესრულდეს. მონაცემები ინახება `postgres_data` volume-ში.

### 4. აპლიკაციის გაშვება

Development რეჟიმი hot reload-ით:

```bash
npm run start:dev
```

სერვერი ხელმისაწვდომი იქნება მისამართზე `http://localhost:3000`.

სხვა ვარიანტები:

```bash
npm run start       # ჩვეულებრივი გაშვება
npm run build       # production build dist/ საქაღალდეში
npm run start:prod  # build-ის შემდეგ production გაშვება
```

ფორმატირებისთვის:

```bash
npm run format
```

სერვისების გასაჩერებლად:

```bash
docker compose down
```

PostgreSQL-ის მონაცემებთან ერთად volume-ის წასაშლელად გამოიყენეთ `docker compose down -v`. ეს მიმდინარე მონაცემებს სამუდამოდ წაშლის.

## API

JSON მოთხოვნებისთვის გამოიყენეთ `Content-Type: application/json`. გლობალური `ValidationPipe` ამოწმებს DTO-ებს და DTO-ში არმოცემულ ველებს შლის. ვალიდაციის შეცდომა აბრუნებს HTTP `400` პასუხს.

### `POST /auth/register`

ქმნის ახალ მომხმარებელს. პაროლი ინახება bcrypt hash-ის სახით, ხოლო პასუხში `password_hash` არ ბრუნდება. `role` რეგისტრაციისას ავტომატურად არის `user`.

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nino",
    "surname": "Beridze",
    "birthdate": "2000-01-15",
    "phone": "555123456",
    "city": "Tbilisi",
    "email": "nino@example.com",
    "password": "password123"
  }'
```

თუ იგივე email უკვე არსებობს, endpoint აბრუნებს HTTP `409` პასუხს.

### `POST /auth/login`

ამოწმებს email-სა და პაროლს და წარმატების შემთხვევაში აბრუნებს JWT access token-ს. token-ის ვადა არის 1 საათი.

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nino@example.com",
    "password": "password123"
  }'
```

არასწორი email-ის ან პაროლის შემთხვევაში ბრუნდება HTTP `401` პასუხი.

პასუხის ფორმატი:

```json
{
  "accessToken": "<jwt-token>"
}
```

### `GET /users`

აბრუნებს `users` ცხრილის ყველა ჩანაწერს.

```bash
curl http://localhost:3000/users
```

ამ endpoint-ის მიმდინარე რეალიზაცია აბრუნებს მონაცემთა ბაზიდან ყველა ველს, მათ შორის `password_hash`-საც. production გარემოში რეკომენდებულია პაროლის hash-ის პასუხიდან გამორიცხვა.

### `GET /users/me`

აბრუნებს მიმდინარე ავტორიზებული მომხმარებლის პროფილს. საჭიროა login-ით მიღებული JWT Bearer token.

```bash
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer <jwt-token>"
```

პასუხი არ შეიცავს `password_hash` ველს. არასწორი ან არმითითებული token-ის შემთხვევაში მოთხოვნა უარყოფილია.

## ვალიდაცია

რეგისტრაციისას ყველა ქვემოთ ჩამოთვლილი ველი სავალდებულოა. `email` უნდა იყოს სწორი email, ხოლო `password` უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს.

`city`-ის დასაშვები მნიშვნელობები:

`Tbilisi`, `Batumi`, `Kutaisi`, `Rustavi`, `Zugdidi`, `Gori`, `Poti`, `Telavi`, `Senaki`, `Khashuri`

login-ისთვის საჭიროა სწორი `email` და მინიმუმ 8 სიმბოლოსგან შემდგარი პაროლი.

## პროექტის სტრუქტურა

```text
src/
  auth/                  # რეგისტრაცია, login და JWT guard/strategy
  users/                 # users endpoint-ები, service, DTO და ტიპები
  database/              # PostgreSQL pool და users SQL schema
  global/                # Express request-ის TypeScript ტიპები
  shared/types/          # ქალაქებისა და role-ების ტიპები
  app.module.ts          # აპლიკაციის მთავარი module
  main.ts                # NestJS-ის გაშვება და გლობალური ვალიდაცია

docker-compose.yml       # PostgreSQL 17 და მუდმივი volume
```

## პრობლემების მოგვარება

- PostgreSQL-თან დაკავშირების შეცდომისას შეამოწმეთ `docker compose ps`, `.env` და `DB_*` მნიშვნელობების შესაბამისობა Compose-ის კონფიგურაციასთან.
- შეცდომა `relation "users" does not exist`: შეასრულეთ გაშვების განყოფილებაში მოცემული SQL-ის ინიციალიზაციის ბრძანება.
- JWT-თან დაკავშირების შეცდომისას შეამოწმეთ, რომ `.env`-ში `JWT_SECRET` მითითებულია.
- თუ `5432` პორტი დაკავებულია, შეცვალეთ `docker-compose.yml`-ში პორტის mapping და `.env`-ში `DB_PORT`.
- თუ აპლიკაციის პორტი დაკავებულია, მიუთითეთ სხვა პორტი, მაგალითად `PORT=3001`.
