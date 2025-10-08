import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve("supabase/migrations/001_initial_schema.sql");
const migrationContents = readFileSync(migrationPath, "utf-8");

describe("clients table RLS policies", () => {
  it("enables row level security", () => {
    expect(migrationContents).toContain(
      "ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY",
    );
  });

  it("defines select policy scoped by auth.uid()", () => {
    expect(migrationContents).toContain(
      'CREATE POLICY "Users can view their own clients"',
    );
    expect(migrationContents).toContain("USING (auth.uid() = user_id)");
  });

  it("defines insert policy scoped by auth.uid()", () => {
    expect(migrationContents).toContain(
      'CREATE POLICY "Users can insert their own clients"',
    );
    expect(migrationContents).toContain("WITH CHECK (auth.uid() = user_id)");
  });
});
