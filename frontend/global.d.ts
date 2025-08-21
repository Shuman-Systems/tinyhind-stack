// frontend/global.d.ts
import { TinyHindClient as OriginalTinyHindClient } from './tinylib/tinyhind-client';
import { DbSchema, Query } from './tinylib/api-types';

declare global {
  interface Window {
    TinyHindClient: typeof OriginalTinyHindClient;
  }

  const TinyHindClient: typeof OriginalTinyHindClient;
  const DbSchema: DbSchema;
  const Query: Query<any>;
}