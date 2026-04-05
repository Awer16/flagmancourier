# Delivery Aggregator API

Бэкенд для агрегатора службы доставки. Реализован на **FastAPI + SQLAlchemy + PostgreSQL**.

## Структура проекта

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py         # Регистрация, логин, refresh токена
│   │   │   ├── owner.py        # API владельца компании (компании, меню, зоны, заказы)
│   │   │   ├── courier.py      # API курьера (сессии, заказы, статусы)
│   │   │   ├── customer.py     # API покупателя (компании, меню, адреса, заказы)
│   │   │   ├── moderator.py    # Кабинет модератора (модерация, аналитика)
│   │   │   └── websocket.py    # WebSocket для real-time обновлений
│   │   └── dependencies.py     # Зависимости (аутентификация, роли)
│   ├── core/
│   │   ├── config.py           # Настройки приложения
│   │   └── security.py         # JWT, хеширование паролей
│   ├── db/
│   │   └── database.py         # Подключение к БД
│   ├── models/
│   │   └── models.py           # SQLAlchemy модели
│   ├── schemas/
│   │   └── schemas.py          # Pydantic схемы
│   └── main.py                 # Точка входа FastAPI
├── alembic/                    # Миграции БД
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env
```

## Роли пользователей

| Роль | Описание |
|------|----------|
| `customer` | Покупатель: просмотр компаний, создание заказов, отслеживание статуса |
| `courier` | Курьер: смена, принятие заказов, обновление статуса доставки |
| `company_owner` | Владелец: управление компанией, меню, зонами доставки |
| `moderator` | Модератор: проверка компаний/меню/курьеров, блокировка, аналитика |

## API Endpoints

### Auth `/api/v1/auth`
- `POST /register` — Регистрация
- `POST /login` — Вход
- `POST /refresh` — Обновление токена
- `GET /me` — Информация о текущем пользователе

### Owner `/api/v1/owner`
- `POST /companies` — Создать компанию
- `GET /companies` — Мои компании
- `GET /companies/{id}` — Детали компании
- `PATCH /companies/{id}` — Обновить компанию
- `POST /companies/{id}/menu` — Добавить пункт меню
- `GET /companies/{id}/menu` — Меню компании
- `PATCH /companies/{id}/menu/{item_id}` — Обновить пункт меню
- `DELETE /companies/{id}/menu/{item_id}` — Удалить пункт меню
- `POST /companies/{id}/zones` — Создать зону доставки
- `GET /companies/{id}/zones` — Зоны доставки
- `GET /companies/{id}/orders` — Заказы компании

### Courier `/api/v1/courier`
- `POST /session/start` — Начать смену
- `POST /session/end` — Завершить смену
- `GET /session` — Текущая смена
- `GET /orders/available` — Доступные заказы (без адреса)
- `POST /orders/{id}/accept` — Принять заказ (появляется адрес)
- `PATCH /orders/{id}/status` — Обновить статус заказа
- `GET /orders/completed` — Выполненные доставки
- `GET /orders/my` — Текущие заказы

### Customer `/api/v1/customer`
- `GET /companies` — Список компаний
- `GET /companies/{id}` — Детали компании
- `GET /companies/{id}/menu` — Меню компании
- `POST /addresses` — Добавить адрес доставки
- `GET /addresses` — Мои адреса
- `DELETE /addresses/{id}` — Удалить адрес
- `POST /orders` — Создать заказ
- `GET /orders` — Мои заказы
- `GET /orders/{id}` — Детали заказа
- `POST /orders/{id}/cancel` — Отменить заказ

### Moderator `/api/v1/moderator`
- `GET /companies/pending` — Компании на модерации
- `POST /companies/{id}/moderate` — Модерировать компанию
- `GET /menu/pending` — Пункты меню на модерации
- `POST /menu/{id}/moderate` — Модерировать пункт меню
- `GET /couriers/pending` — Курьеры на модерации
- `POST /couriers/{id}/moderate` — Модерировать курьера
- `GET /orders` — Все заказы
- `GET /stats` — Статистика

### WebSocket `/api/v1/ws`
- `WS /ws/{channel}` — Real-time обновления
  - Каналы: `order_{id}`, `company_{id}`, `courier_{id}`

## Запуск

### Через Docker Compose

```bash
cd backend
docker compose up -d
```

API будет доступен на `http://localhost:8000`
Документация Swagger: `http://localhost:8000/docs`
PgAdmin: `http://localhost:5050` (admin@admin.com / admin)

### Локально

1. Установите зависимости:
```bash
pip install -r requirements.txt
```

2. Запустите PostgreSQL (через Docker):
```bash
docker compose up -d postgres pgadmin
```

3. Примените миграции:
```bash
alembic revision --autogenerate -m "init"
alembic upgrade head
```

4. Запустите сервер:
```bash
uvicorn app.main:app --reload
```

## Статусы заказа

```
PENDING → ACCEPTED → PICKED_UP → IN_DELIVERY → DELIVERED
                     ↓
                 CANCELLED
```

## Безопасность

- JWT аутентификация (access + refresh токены)
- Хэширование паролей (bcrypt)
- Изоляция данных компаний (владельцы видят только свои)
- Модерация компаний, меню и курьеров
- Блокировка пользователей и компаний

## Технологии

- **FastAPI** — веб-фреймворк
- **SQLAlchemy 2.0** — ORM, async
- **Alembic** — миграции
- **PostgreSQL** — база данных
- **python-jose** — JWT
- **passlib + bcrypt** — хеширование
- **WebSockets** — real-time уведомления
- **Docker** — контейнеризация
