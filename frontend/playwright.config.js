// import { defineConfig } from "@playwright/test";

// export default defineConfig({
//   testDir: "./src/tests/e2e",
//   timeout: 30000,
//   use: {
//     headless: true,
//     baseURL: "http://localhost:3000",
//     viewport: { width: 1300, height: 720 },
//   },
//   projects: [
//     {
//       name: "chromium",
//       use: { browserName: "chromium" },
//     },
//   ],
//   webServer: {
//     command: "npm run build && npm run preview",
//     port: 3000,
//     reuseExistingServer: false,
//     timeout: 120000,
//   },
// });


import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 30000,
  use: {
    headless: true,
    baseURL: "http://localhost:3000",
    viewport: { width: 1300, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node ../backend/server.js",
      port: 5000,
      reuseExistingServer: true,
      timeout: 15000,
    },
    {
      command: "npm run build && npm run preview",
      port: 3000,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});