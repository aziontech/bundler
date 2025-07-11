/**
 * This code was originally copied and modified from the @edge-runtime/vm repository.
 * Significant changes have been made to adapt it for use with Azion.
 */
export interface DispatchFetch {
  (
    input: string,
    init?: RequestInit,
  ): Promise<
    Response & {
      // eslint-disable-next-line   @typescript-eslint/no-explicit-any
      waitUntil: () => Promise<any>;
    }
  >;
}

export interface RejectionHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  (reason?: {} | null, promise?: Promise<any>): void;
}

export interface ErrorHandler {
  // eslint-disable-next-line @typescript-eslint/ban-types
  (error?: {} | null): void;
}
