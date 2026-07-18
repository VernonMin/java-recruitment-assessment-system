export type AppBindings = {
  APP_NAME: string;
  APP_SECRET: string;
  AI_REVIEW_ENABLED?: string;
  AI_REVIEW_BASE_URL?: string;
  AI_REVIEW_API_KEY?: string;
  AI_REVIEW_MODEL?: string;
  DB: D1Database;
  PROCTORING_BUCKET: R2Bucket;
};

export type SessionUser = {
  sub: string;
  account: string;
  roles: string[];
  exp: number;
};

export type AppContext = {
  Bindings: AppBindings;
  Variables: {
    sessionUser: SessionUser | null;
  };
};
