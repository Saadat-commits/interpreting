import postgres from "postgres";
import type { Booking, ChatMessage, Invoice, ServiceRequest } from "@/lib/types";
import type { Store } from "./index";

/**
 * Postgres-Speicher (z. B. Supabase). Die Tabellen werden beim ersten Zugriff
 * automatisch angelegt. Row Level Security ist aktiviert und ohne Policies –
 * damit sind die Daten über die öffentliche Supabase-API NICHT abrufbar; nur
 * dieser Server greift über die Datenbankverbindung darauf zu.
 */
const SCHEMA = `
create table if not exists bookings (
  id text primary key,
  data jsonb not null,
  status text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  token_hash text,
  created_at timestamptz not null default now()
);
create index if not exists bookings_time_idx on bookings (start_at, end_at);
create unique index if not exists bookings_token_idx on bookings (token_hash);
create table if not exists invoices (
  id text primary key,
  booking_id text not null,
  number text not null unique,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists chat_messages (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists counters (
  name text primary key,
  value integer not null
);
create table if not exists service_requests (
  id text primary key,
  reference text not null unique,
  service text not null,
  status text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table bookings enable row level security;
alter table invoices enable row level security;
alter table chat_messages enable row level security;
alter table counters enable row level security;
alter table service_requests enable row level security;
`;

type Sql = postgres.Sql;

export class PostgresStore implements Store {
  private sql: Sql;
  private ready: Promise<void> | null = null;

  constructor(url: string) {
    // prepare: false → kompatibel mit dem Supabase-Transaction-Pooler (Port 6543)
    this.sql = postgres(url, { prepare: false, max: 3, idle_timeout: 20, ssl: url.includes("localhost") ? false : "require" });
  }

  private init() {
    this.ready ??= this.sql.unsafe(SCHEMA).then(() => undefined);
    return this.ready;
  }

  private static row(b: Booking) {
    return { id: b.id, data: b, status: b.status, start_at: b.start, end_at: b.end, token_hash: b.verification?.tokenHash ?? null };
  }

  private async nextSeq(tx: Sql, name: string) {
    const [r] = await tx`
      insert into counters (name, value) values (${name}, 1)
      on conflict (name) do update set value = counters.value + 1
      returning value`;
    return r.value as number;
  }

  async listBookings(filter: { from?: Date; to?: Date; includeCancelled?: boolean } = {}) {
    await this.init();
    const rows = await this.sql`
      select data from bookings
      where (${filter.includeCancelled ?? false} or status <> 'cancelled')
        and (${filter.from ?? null}::timestamptz is null or end_at >= ${filter.from ?? null})
        and (${filter.to ?? null}::timestamptz is null or start_at <= ${filter.to ?? null})`;
    return rows.map((r) => r.data as Booking);
  }

  async getBooking(id: string) {
    await this.init();
    const [r] = await this.sql`select data from bookings where id = ${id}`;
    return (r?.data as Booking) ?? null;
  }

  async findBookingByTokenHash(hash: string) {
    await this.init();
    const [r] = await this.sql`select data from bookings where token_hash = ${hash}`;
    return (r?.data as Booking) ?? null;
  }

  async createBooking(build: (seq: number) => Booking, guard?: (existing: Booking[]) => boolean) {
    await this.init();
    return this.sql.begin(async (tx) => {
      // Eine Sperre für alle Buchungen: verhindert Doppelbuchungen bei gleichzeitigen Anfragen
      await tx`select pg_advisory_xact_lock(4711)`;
      const draft = build(0);
      const from = new Date(new Date(draft.start).getTime() - 2 * 86400000);
      const to = new Date(new Date(draft.end).getTime() + 2 * 86400000);
      const nearby = await tx`select data from bookings where status <> 'cancelled' and end_at >= ${from} and start_at <= ${to}`;
      if (guard && !guard(nearby.map((r) => r.data as Booking))) return null;
      // Nummer erst vergeben, wenn der Termin wirklich frei ist
      const year = String(new Date().getFullYear());
      const booking = { ...draft, reference: build(await this.nextSeq(tx as unknown as Sql, `booking:${year}`)).reference };
      const row = PostgresStore.row(booking);
      await tx`insert into bookings (id, data, status, start_at, end_at, token_hash)
        values (${row.id}, ${tx.json(booking as never)}, ${row.status}, ${row.start_at}, ${row.end_at}, ${row.token_hash})`;
      return booking;
    }) as Promise<Booking | null>;
  }

  async updateBooking(id: string, patch: Partial<Booking>) {
    await this.init();
    return this.sql.begin(async (tx) => {
      const [r] = await tx`select data from bookings where id = ${id} for update`;
      if (!r) return null;
      const next = { ...(r.data as Booking), ...patch, updatedAt: new Date().toISOString() } as Booking;
      const row = PostgresStore.row(next);
      await tx`update bookings set data = ${tx.json(next as never)}, status = ${row.status}, start_at = ${row.start_at}, end_at = ${row.end_at}, token_hash = ${row.token_hash} where id = ${id}`;
      return next;
    }) as Promise<Booking | null>;
  }

  async createInvoice(build: (seq: number) => Invoice) {
    await this.init();
    return this.sql.begin(async (tx) => {
      const year = String(new Date().getFullYear());
      const seq = await this.nextSeq(tx as unknown as Sql, `invoice:${year}`);
      const invoice = build(seq);
      await tx`insert into invoices (id, booking_id, number, data) values (${invoice.id}, ${invoice.bookingId}, ${invoice.number}, ${tx.json(invoice as never)})`;
      return invoice;
    }) as Promise<Invoice>;
  }

  async getInvoice(id: string) {
    await this.init();
    const [r] = await this.sql`select data from invoices where id = ${id}`;
    return (r?.data as Invoice) ?? null;
  }

  async addChatMessage(msg: ChatMessage) {
    await this.init();
    await this.sql`insert into chat_messages (id, data) values (${msg.id}, ${this.sql.json(msg as never)})`;
  }

  async createServiceRequest(build: (seq: number) => ServiceRequest) {
    await this.init();
    return this.sql.begin(async (tx) => {
      const year = String(new Date().getFullYear());
      const r = build(await this.nextSeq(tx as unknown as Sql, `request:${year}`));
      await tx`insert into service_requests (id, reference, service, status, data) values (${r.id}, ${r.reference}, ${r.service}, ${r.status}, ${tx.json(r as never)})`;
      return r;
    }) as Promise<ServiceRequest>;
  }
}
