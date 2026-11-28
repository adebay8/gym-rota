import { MongoClient } from 'mongodb';

import { ProgressHelpers } from '../../progress/progress.helpers.ts';
import type { Progress } from '../../progress/progress.types.ts';
import { DEFAULT_DATABASE, PROGRESS_COLLECTION, PROGRESS_DOCUMENT_ID, SERVER_SELECTION_TIMEOUT_MS } from './sync-server.constants.ts';
import type { ProgressRepository } from './sync-server.types.ts';

interface ProgressDocument {
  _id: string;
  progress: Progress;
  updatedAt: Date;
}

// One client per server instance, reused across requests (Vercel keeps warm functions alive between calls).
const cache = globalThis as unknown as { rotaMongo?: { uri: string; client: Promise<MongoClient> } };

function connect(uri: string): Promise<MongoClient> {
  if (cache.rotaMongo?.uri !== uri) {
    const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS }).connect();
    // A failed connection shouldn't be cached forever.
    client.catch(() => {
      if (cache.rotaMongo?.client === client) delete cache.rotaMongo;
    });
    cache.rotaMongo = { uri, client };
  }
  return cache.rotaMongo.client;
}

export class MongoProgressRepository {
  static async open(uri: string, databaseName: string | undefined): Promise<ProgressRepository> {
    const client = await connect(uri);
    const collection = client.db(databaseName || DEFAULT_DATABASE).collection<ProgressDocument>(PROGRESS_COLLECTION);
    return {
      read: async () => {
        const document = await collection.findOne({ _id: PROGRESS_DOCUMENT_ID });
        // Validate what comes back too: the document could have been edited by hand in Atlas.
        return document ? ProgressHelpers.fromUnknown(document.progress) : null;
      },
      write: async (progress) => {
        await collection.replaceOne({ _id: PROGRESS_DOCUMENT_ID }, { progress, updatedAt: new Date() }, { upsert: true });
      },
    };
  }
}
