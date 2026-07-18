import type { UserDocument } from '../models/User.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * The authenticated user, attached by the `protect` middleware.
       * Guaranteed to be present on any route mounted behind `protect`.
       */
      user: UserDocument;
    }
  }
}

export {};
