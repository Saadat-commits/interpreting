import { promises as fs } from "node:fs";
import path from "node:path";
import type { Booking, ChatMessage, Invoice, ServiceRequest } from "@/lib/types";
import type { Store } from "./index";

interface DbShape {
  version: 1;
  counters: { booking: Record<string, number>; invoice: Record<string, number>; request?: Record<string, number> };
  bookings: Booking[];
  invoices: Invoice[];
  chat: ChatMessage[];
  /** Erst mit den Leistungsanfragen hinzugekommen – fehlt in älteren db.json */
  requests?: ServiceRequest[];
}

const empty = (): DbShape => ({ version: 1, counters: { booking: {}, invoice: {} }, bookings: [], invoices: [], chat: [] });

export class JsonFileStore implements Store {
  private file: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private dir: string) {
    this.file = path.join(dir, "db.json");
  }

  private async read(): Promise<DbShape> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8")) as DbShape;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return empty();
      throw e;
    }
  }

  private async write(db: DbShape) {
    await fs.mkdir(this.dir, { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, this.file);
  }

  /** Serialisiert alle Schreibzugriffe innerhalb des Prozesses. */
  private tx<T>(fn: (db: DbShape) => Promise<T> | T): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read();
      const result = await fn(db);
      await this.write(db);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async listBookings(filter: { from?: Date; to?: Date; includeCancelled?: boolean } = {}) {
    const db = await this.read();
    return db.bookings.filter((b) => {
      if (!filter.includeCancelled && b.status === "cancelled") return false;
      if (filter.from && new Date(b.end) < filter.from) return false;
      if (filter.to && new Date(b.start) > filter.to) return false;
      return true;
    });
  }

  async getBooking(id: string) {
    return (await this.read()).bookings.find((b) => b.id === id) ?? null;
  }

  async findBookingByTokenHash(hash: string) {
    return (await this.read()).bookings.find((b) => b.verification?.tokenHash === hash) ?? null;
  }

  createBooking(build: (seq: number) => Booking, guard?: (existing: Booking[]) => boolean) {
    return this.tx((db) => {
      if (guard && !guard(db.bookings.filter((b) => b.status !== "cancelled"))) return null;
      const year = String(new Date().getFullYear());
      const seq = (db.counters.booking[year] ?? 0) + 1;
      db.counters.booking[year] = seq;
      const booking = build(seq);
      db.bookings.push(booking);
      return booking;
    });
  }

  updateBooking(id: string, patch: Partial<Booking>) {
    return this.tx((db) => {
      const i = db.bookings.findIndex((b) => b.id === id);
      if (i < 0) return null;
      db.bookings[i] = { ...db.bookings[i], ...patch, updatedAt: new Date().toISOString() };
      return db.bookings[i];
    });
  }

  createInvoice(build: (seq: number) => Invoice) {
    return this.tx((db) => {
      const year = String(new Date().getFullYear());
      const seq = (db.counters.invoice[year] ?? 0) + 1;
      db.counters.invoice[year] = seq;
      const invoice = build(seq);
      db.invoices.push(invoice);
      return invoice;
    });
  }

  async getInvoice(id: string) {
    return (await this.read()).invoices.find((i) => i.id === id) ?? null;
  }

  addChatMessage(msg: ChatMessage) {
    return this.tx((db) => {
      db.chat.push(msg);
    });
  }

  createServiceRequest(build: (seq: number) => ServiceRequest) {
    return this.tx((db) => {
      const year = String(new Date().getFullYear());
      db.counters.request ??= {};
      const seq = (db.counters.request[year] ?? 0) + 1;
      db.counters.request[year] = seq;
      const request = build(seq);
      (db.requests ??= []).push(request);
      return request;
    });
  }
}
