// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   roots: ['<rootDir>/tests'],
//   clearMocks: true,
//   collectCoverage: true,
//   collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
//   coverageDirectory: 'coverage',
// };
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",             // اجرای تست‌ها با TypeScript
  testEnvironment: "node",       // محیط اجرای تست (Node.js)
  clearMocks: true,              // هر تست، mockها رو ریست می‌کنه
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"], // فایل cleanup دیتابیس
  moduleFileExtensions: ["ts", "js", "json"],       // پسوندهای قابل پشتیبانی
  testMatch: ["**/tests/**/*.test.ts"],             // مسیر فایل‌های تست
  verbose: true,                 // لاگ‌های واضح‌تر
};
