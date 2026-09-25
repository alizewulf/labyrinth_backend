# Labyrinth


Backend დაწერილია **NestJS + TypeScript**-ზე.

> **⚠️ :** `UsersService` ამჟამად აბრუნებს mock მონაცემებს.

---

## 🛠 ტექნოლოგიები

- NestJS
- TypeScript
- Node.js
- class-validator
- class-transformer
- Vitest

---

## 📁 პროექტის სტრუქტურა

```
src/
├── app.module.ts
├── main.ts
├── shared/
│   └── types/
│       └── city.types.ts
└── users/
    ├── dto/
    │   ├── create-user.dto.ts
    │   └── login-user.dto.ts
    ├── spec/
    │   ├── users.controller.spec.ts
    │   └── users.service.spec.ts
    ├── users.controller.ts
    ├── users.module.ts
    ├── users.service.ts
    └── user.types.ts
```

---

## 🏗 არქიტექტურა

პროექტი იყენებს NestJS-ის მოდულურ არქიტექტურას.

`users` მოდულის ნაკადი:

```
HTTP Request
     ↓
UsersController
     ↓
DTO + Validation
     ↓
UsersService
     ↓
Mock data
```

### AppModule

აპლიკაციის root მოდული. ამჟამად რეგისტრირებული აქვს:

```ts
imports: [UsersModule]
```

### Users Module

პასუხისმგებელია მომხმარებლებთან დაკავშირებულ ფუნქციონალზე:

- **UsersController** — HTTP endpoint-ები
- **UsersService** — ბიზნეს ლოგიკა
- **DTO-ები** — შემომავალი მონაცემების ვალიდაცია
- **User types** — TypeScript ტიპები

### User მოდელი

```ts
interface User {
  id: number;
  name: string;
  surname: string;
  birthdate: string;
  phone: string;
  city: City;
  email: string;
  role: UserRole;
  password_hash: string;
  createdAt: string;
  updatedAt: string;
}

type UserRole = "admin" | "user" | "doctor";
```

### ქალაქები (City)

ქალაქების სია ფიქსირებულია `shared/types/city.types.ts`-ში:

`Tbilisi`, `Batumi`, `Kutaisi`, `Rustavi`, `Zugdidi`, `Gori`, `Poti`, `Telavi`, `Senaki`, `Khashuri`

---

## 🌐 API

Base prefix: `/users`

### `GET /users`

აბრუნებს მომხმარებლების სიას (ამჟამად — mock მონაცემები).

**Request**
```http
GET http://localhost:3000/users
```

**Response**
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

> ⚠️ `password_hash` არ უნდა ბრუნდებოდეს რეალურ production response-ში — ეს ჯერჯერობით mock-ის ნაწილია.

---

### `POST /users/register`

მომხმარებლის რეგისტრაცია.

**Request**
```http
POST http://localhost:3000/users/register
Content-Type: application/json
```

**Body**
```json
{
  "name": "Alize",
  "surname": "Test",
  "birthdate": "2006-02-14",
  "phone": "555123456",
  "city": "Tbilisi",
  "email": "alize@example.com",
  "role": "user",
  "password": "12345678"
}
```

**ვალიდაცია (`CreateUserDto`):**

| ველი | წესი |
|---|---|
| `name` | string |
| `surname` | string |
| `birthdate` | string |
| `phone` | string |
| `city` | დაშვებული ქალაქებიდან ერთ-ერთი |
| `email` | ვალიდური email ფორმატი |
| `role` | `admin`, `user` ან `doctor` |
| `password` | მინიმუმ 8 სიმბოლო |

---

### `POST /users/login`

მომხმარებლის ავტორიზაცია.

**Request**
```http
POST http://localhost:3000/users/login
Content-Type: application/json
```

**Body**
```json
{
  "email": "alize@example.com",
  "password": "12345678"
}
```

**ვალიდაცია (`LoginUserDto`):** `email`, `password` (მინ. 8 სიმბოლო).

> ⚠️ რეალური ავტორიზაციის ლოგიკა (JWT) ჯერ არ არის იმპლემენტირებული.

---

## 📦 DTO ფაილები

| DTO | ფაილი | გამოიყენება |
|---|---|---|
| `CreateUserDto` | `users/dto/create-user.dto.ts` | `POST /users/register` |
| `LoginUserDto` | `users/dto/login-user.dto.ts` | `POST /users/login` |

Global validation ჩართულია `main.ts`-ში:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
```

`whitelist: true` შლის request-იდან ყველა ველს, რომელიც DTO-ში აღწერილი არ არის.

---

## 🚀 გაშვება

**Dependencies:**
```bash
npm install
```

**Development:**
```bash
npm run start:dev
```

Backend გაეშვება: `http://localhost:3000`

---

## ✅ სტატუსი

### დასრულებულია
- NestJS პროექტის ინიციალიზაცია
- AppModule / UsersModule
- UsersController / UsersService
- User TypeScript types
- CreateUserDto / LoginUserDto
- Request validation
- `GET /users`
- `POST /users/register`, `POST /users/login` endpoint-ების სტრუქტურა
## 🔒 უსაფრთხოება

- პაროლი database-ში არასდროს ინახება plaintext ფორმით — მხოლოდ `password_hash`.
- `password_hash` არ უნდა დაბრუნდეს client-ისთვის რეალურ API response-ში.

```
password → hashing → password_hash → PostgreSQL
```
