import { test, expect } from "@playwright/test";

test.describe("Kanban Board E2E", () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post("http://localhost:5000/test/reset");
    await page.goto("/");
    await expect(page.getByText("Connected")).toBeVisible({ timeout: 10000 });
  });

  test("loads the kanban board", async ({ page }) => {
    await expect(page.getByText("Kanban Board")).toBeVisible();
  });

  test("can create a task", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("E2E Test Task");
    await page.getByText("Add Task").click();
    await expect(page.getByText("E2E Test Task")).toBeVisible();
  });

  test("can delete a task", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("Task To Delete");
    await page.getByText("Add Task").click();
    await expect(page.getByText("Task To Delete")).toBeVisible();
    await page.getByTitle("Delete task").first().click();
    await expect(page.getByText("Task To Delete")).not.toBeVisible();
  });

  test("can select priority level", async ({ page }) => {
    await page.locator("select").first().selectOption("High");
    await expect(page.locator("select").first()).toHaveValue("High");
  });

  test("can select category", async ({ page }) => {
    await page.locator("select").nth(1).selectOption("Bug");
    await expect(page.locator("select").nth(1)).toHaveValue("Bug");
  });

  test("invalid file shows error message", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles({
      name: "test.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake pdf content"),
    });
    await expect(page.getByText(/Invalid file type/)).toBeVisible();
  });

  test("can edit a task", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("Task To Edit");
    await page.getByText("Add Task").click();
    await expect(page.getByText("Task To Edit")).toBeVisible();
    await page.getByTitle("Edit task").first().click();
    const editInput = page.locator('input[value="Task To Edit"]');
    await editInput.fill("Edited Task Title");
    await page.getByText("Save").click();
    await expect(page.getByText("Edited Task Title")).toBeVisible();
  });
});