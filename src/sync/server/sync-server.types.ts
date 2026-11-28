import type { Progress } from '../../progress/progress.types.ts';

/** Where the one progress document lives. An interface so the handler can be tested without a database. */
export interface ProgressRepository {
  read(): Promise<Progress | null>;
  write(progress: Progress): Promise<void>;
}

export interface ProgressApiOptions {
  /** ROTA_SYNC_KEY: the key you type into the app once. */
  readonly syncKey: string | undefined;
  /** Null when MONGO_URI isn't set. */
  readonly openRepository: (() => Promise<ProgressRepository>) | null;
}
