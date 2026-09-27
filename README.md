# Labyrinth Backend

ეს არის NestJS-ზე აგებული backend-აპლიკაცია. პროექტში ამჟამად არის ავტორიზაციის ორი endpoint-ი, მომხმარებლების სიის endpoint-ი და PostgreSQL-თან კავშირის მოდული.

## ტექნოლოგიები

- Node.js და TypeScript
- NestJS
- PostgreSQL 17
- Docker Compose

## გაშვება ნულიდან

### საჭირო პროგრამები

დაგჭირდებათ:

- Node.js-ის LTS ვერსია და npm
- Docker და Docker Compose
- Git, თუ პროექტს repository-დან იწერთ

### 1. პროექტის ჩამოტვირთვა

```bash
git clone https://github.com/alizewulf/labyrinth_backend/
cd labyrinth_back
```

თუ პროექტი არქივის სახით ჩამოტვირთეთ, გახსენით საქაღალდე და შედით მასში:

```bash
cd labyrinth_back
```

### 2. დამოკიდებულებების დაყენება

```bash
npm install
```

### 3. გარემოს ცვლადების შემოწმება

პროექტის root საქაღალდეში უნდა არსებობდეს `.env` ფაილი:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=labyrinth
DB_USER=labyrinth
DB_PASSWORD=labyrinth
```

ეს მნიშვნელობები შეესაბამება `docker-compose.yml`-ში აღწერილ PostgreSQL კონტეინერს.

### 4. PostgreSQL-ის გაშვება

```bash
docker compose up -d postgres
```

კონტეინერის სტატუსის სანახავად:

```bash
docker compose ps
```

### 5. backend-ის გაშვება

Development რეჟიმი:

```bash
npm run start:dev
```

სერვერი ხელმისაწვდომი იქნება მისამართზე `http://localhost:3000`.

ჩვეულებრივი გაშვება:

```bash
npm run start
```

Production build-ის გაშვება:

```bash
npm run build
npm run start:prod
```

აპლიკაციის გასაჩერებლად გამოიყენეთ `Ctrl+C`, ხოლო PostgreSQL-ის გასაჩერებლად:

```bash
docker compose down
```

## API endpoint-ები

ყველა endpoint იყენებს JSON-ს. ვალიდაციის შეცდომის შემთხვევაში NestJS აბრუნებს HTTP `400` პასუხს.

### `POST /auth/register`

მომხმარებლის რეგისტრაციის endpoint-ი. ყველა ქვემოთ ჩამოთვლილი ველი სავალდებულოა. `password` უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს.

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
    "role": "user",
    "password": "password123"
  }'
```

ამჟამინდელ კოდში endpoint დროებით აბრუნებს მომხმარებლების დემო-სიას და მონაცემს ბაზაში არ ინახავს.

### `POST /auth/login`

მიღებს ელფოსტასა და პაროლს:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nino@example.com",
    "password": "password123"
  }'
```

ამჟამინდელ კოდში login რეალურ ავტორიზაციას არ ასრულებს და ასევე აბრუნებს დემო-მომხმარებლების სიას.

### `GET /users`

აბრუნებს მომხმარებლების ამჟამინდელ დემო-სიას:

```bash
curl http://localhost:3000/users
```

პასუხის მაგალითი:

```json
[
  {
    "id": 1,
    "name": "Alize",
    "surname": "Test",
    "birthdate": "2006-02-14",
    "phone": "555123456",
    "city": "Tbilisi",
    "email": "alize@example.com",
    "role": "user",
    "password_hash": "hashed-password",
    "createdAt": "2026-09-25",
    "updatedAt": "2026-09-25"
  }
]
```

## დასაშვები მნიშვნელობები

`city` ველისთვის დასაშვებია:

`Tbilisi`, `Batumi`, `Kutaisi`, `Rustavi`, `Zugdidi`, `Gori`, `Poti`, `Telavi`, `Senaki`, `Khashuri`

`role` ველისთვის დასაშვებია:

`admin`, `user`, `doctor`

## პროექტის სტრუქტურა

- `src/auth` — რეგისტრაციისა და login-ის controller/service
- `src/users` — მომხმარებლების controller/service, DTO და ტიპები
- `src/database` — PostgreSQL connection pool
- `src/shared/types` — საერთო ტიპები, მათ შორის ქალაქების სია
- `docker-compose.yml` — PostgreSQL 17-ის კონფიგურაცია

## პრობლემების მოგვარება

- თუ აპლიკაცია PostgreSQL-თან დაკავშირების შეცდომით ჩერდება, შეამოწმეთ, რომ `docker compose up -d postgres` შესრულებულია და `.env`-ში მითითებული მონაცემები ემთხვევა `docker-compose.yml`-ს.
- თუ პორტი `5432` ან `3000` დაკავებულია, გაათავისუფლეთ შესაბამისი პორტი ან შეცვალეთ კონფიგურაცია.
- PostgreSQL-ის მონაცემების სრულად წასაშლელად გამოიყენეთ მხოლოდ მაშინ, როცა მონაცემების დაკარგვა მისაღებია:

```bash
docker compose down -v
```
