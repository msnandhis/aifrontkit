export interface SchemaMigration<TInput = unknown, TOutput = unknown> {
  from: number;
  to: number;
  migrate(input: TInput): TOutput;
}

export function registerMigration<TInput, TOutput>(migration: SchemaMigration<TInput, TOutput>): SchemaMigration<TInput, TOutput> {
  if (migration.to !== migration.from + 1) throw new Error("Schema migrations must advance exactly one major version.");
  return migration;
}
