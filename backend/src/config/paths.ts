import path from 'path';

// در dev (__dirname = backend/src/config)  ⇒  ../.. = backend
// در prod (__dirname = backend/dist/config) ⇒  ../.. = backend
const appRoot =
  process.env.APP_ROOT && process.env.APP_ROOT.trim().length > 0
    ? path.resolve(process.env.APP_ROOT)
    : path.resolve(__dirname, '..', '..'); // ⬅️ دو سطح

export const PATHS = {
  root: () => appRoot,
  join: (...seg: string[]) => path.join(appRoot, ...seg),
  public: () => path.join(appRoot, 'public'),
  uploads: () => path.join(appRoot, 'uploads'),
  tmp: () => path.join(appRoot, 'tmp'),
  logs: () => path.join(appRoot, 'logs'),
};
