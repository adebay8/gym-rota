import { MongoProgressRepository } from '../../../sync/server/mongo-progress.repository.ts';
import { ProgressApiHandler } from '../../../sync/server/progress-api.handler.ts';
import type { ProgressApiOptions } from '../../../sync/server/sync-server.types.ts';

// The MongoDB driver needs Node, and every call must reach the database.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function options(): ProgressApiOptions {
  const uri = process.env.MONGO_URI;
  return {
    syncKey: process.env.ROTA_SYNC_KEY,
    openRepository: uri ? () => MongoProgressRepository.open(uri, process.env.MONGO_DB) : null,
  };
}

export function GET(request: Request): Promise<Response> {
  return ProgressApiHandler.handle(request, options());
}

export function PUT(request: Request): Promise<Response> {
  return ProgressApiHandler.handle(request, options());
}
