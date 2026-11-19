type Row = Record<string, any>;

function isOperator(v: any): boolean {
  return v && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v);
}

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (cond === undefined) return true;
    const value = row[key];
    const OPS = ["in", "not", "gte", "lte", "gt", "lt", "equals"];
    if (isOperator(cond) && !Object.keys(cond).some((k) => OPS.includes(k))) {
      return Object.entries(cond).every(([sub, v]) => row[sub] === v);
    }
    if (isOperator(cond)) {
      if ("in" in cond && !cond.in.includes(value)) return false;
      if ("not" in cond && value === cond.not) return false;
      if ("gte" in cond && !(value >= cond.gte)) return false;
      if ("lte" in cond && !(value <= cond.lte)) return false;
      if ("gt" in cond && !(value > cond.gt)) return false;
      if ("lt" in cond && !(value < cond.lt)) return false;
      if ("equals" in cond && value !== cond.equals) return false;
      return true;
    }
    return value === cond;
  });
}

let seq = 0;

class Table {
  rows: Row[] = [];
  constructor(private uniques: string[] = []) {}

  private applyData(row: Row, data: Row) {
    for (const [k, v] of Object.entries(data)) {
      if (isOperator(v) && "increment" in v) row[k] = (row[k] ?? 0) + v.increment;
      else row[k] = v;
    }
  }

  async create({ data }: { data: Row }) {
    for (const u of this.uniques) {
      if (data[u] != null && this.rows.some((r) => r[u] === data[u])) {
        const e: any = new Error(`Unique constraint failed on ${u}`);
        e.code = "P2002";
        throw e;
      }
    }
    const row: Row = { id: `id_${++seq}`, createdAt: new Date(), ...data };
    this.rows.push(row);
    return { ...row };
  }
  async findUnique({ where }: { where: Row }) {
    const r = this.rows.find((x) => matches(x, where));
    return r ? { ...r } : null;
  }
  async findUniqueOrThrow(args: { where: Row }) {
    const r = await this.findUnique(args);
    if (!r) throw new Error("Record not found");
    return r;
  }
  async findFirst({ where }: { where?: Row } = {}) {
    const r = this.rows.find((x) => matches(x, where));
    return r ? { ...r } : null;
  }
  async findFirstOrThrow(args: { where?: Row }) {
    const r = await this.findFirst(args);
    if (!r) throw new Error("Record not found");
    return r;
  }
  async findMany({ where, take }: { where?: Row; take?: number } = {}) {
    const out = this.rows.filter((x) => matches(x, where)).map((x) => ({ ...x }));
    return take ? out.slice(0, take) : out;
  }
  async count({ where }: { where?: Row } = {}) {
    return this.rows.filter((x) => matches(x, where)).length;
  }
  async update({ where, data }: { where: Row; data: Row }) {
    const r = this.rows.find((x) => matches(x, where));
    if (!r) throw new Error("Record to update not found");
    this.applyData(r, data);
    return { ...r };
  }
  async updateMany({ where, data }: { where?: Row; data: Row }) {
    const hits = this.rows.filter((x) => matches(x, where));
    hits.forEach((r) => this.applyData(r, data));
    return { count: hits.length };
  }
  async upsert({ where, update, create }: { where: Row; update: Row; create: Row }) {
    const r = this.rows.find((x) => matches(x, where));
    if (r) {
      this.applyData(r, update);
      return { ...r };
    }
    return this.create({ data: create });
  }
  async delete({ where }: { where: Row }) {
    const i = this.rows.findIndex((x) => matches(x, where));
    if (i < 0) throw new Error("Record to delete not found");
    return this.rows.splice(i, 1)[0];
  }
  async aggregate({ where }: { where?: Row } = {}) {
    const hits = this.rows.filter((x) => matches(x, where));
    return { _sum: { estimatedCostUsd: hits.reduce((s, r) => s + (r.estimatedCostUsd ?? 0), 0) } };
  }
}

const UNIQUES: Record<string, string[]> = {
  payment: ["providerRef"],
  quote: ["quoteRef"],
  scheduledPost: ["idempotencyKey"],
};

export function createFakeDb() {
  const tables: Record<string, Table> = {};
  const db: any = new Proxy(
    {},
    {
      get(_t, name: string) {
        if (name === "$transaction") {
          return async (arg: any) => (typeof arg === "function" ? arg(db) : Promise.all(arg));
        }
        return (tables[name] ??= new Table(UNIQUES[name] ?? []));
      },
    },
  );
  return db as any;
}
