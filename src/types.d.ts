export type AppBindings = {
  APP_NAME: string;
  APP_SECRET: string;
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
