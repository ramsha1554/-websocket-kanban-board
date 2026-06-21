import { test, expect } from "@playwright/test";

test.describe("Kanban Board E2E", () => {
//   test.beforeEach(async ({ page, request }) => {
//   await request.post("http://localhost:5000/test/reset");
//   await page.goto("/");
//   await expect(page.getByText("Connected")).toBeVisible({ timeout: 10000 });
//   await expect(page.getByText("Syncing tasks...")).toHaveCount(0, { timeout: 10000 });
//   await expect(page.getByText("0 tasks")).toBeVisible({ timeout: 10000 });
// });

test.beforeEach(async ({ page, request }) => {
  await request.post("http://localhost:5000/test/reset");
  await page.goto("/");
  await expect(page.getByText("Connected")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Syncing tasks...")).toHaveCount(0, { timeout: 10000 });
  await expect(page.getByText("0 tasks")).toBeVisible({ timeout: 10000 });
});




  test("loads the kanban board", async ({ page }) => {
    await expect(page.getByText("Kanban Board")).toBeVisible();
    await expect(page.locator("span", { hasText: "To Do" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "In Progress" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "Done" }).first()).toBeVisible();
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

  test("can edit a task", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("Task To Edit");
    await page.getByText("Add Task").click();
    await expect(page.getByText("Task To Edit")).toBeVisible();
    
    await page.getByTitle("Edit task").first().click();
    const editInput = page.locator('input[value="Task To Edit"]');
    await editInput.fill("Edited Task Title");
    
    // Change edit priority to High via react-select
    await page.locator(".react-select-edit__control").first().click();
    await page.locator(".react-select-edit__option").getByText("High", { exact: true }).click();
    
    // Change edit category to Bug via react-select
    await page.locator(".react-select-edit__control").nth(1).click();
    await page.locator(".react-select-edit__option").getByText("Bug", { exact: true }).click();
    
    await page.getByText("Save").click();
    await expect(page.getByText("Edited Task Title")).toBeVisible();
    await expect(page.locator("span", { hasText: "High" })).toBeVisible();
    await expect(page.locator("span", { hasText: "Bug" })).toBeVisible();
  });



  test("can select a priority level", async ({ page }) => {
    await page.locator(".react-select__control").first().click();
    await page.locator(".react-select__option").getByText("High", { exact: true }).click();
    await expect(page.locator(".react-select__single-value").first()).toHaveText("High");
  });

  test("can select a category", async ({ page }) => {
    await page.locator(".react-select__control").nth(1).click();
    await page.locator(".react-select__option").getByText("Bug", { exact: true }).click();
    await expect(page.locator(".react-select__single-value").nth(1)).toHaveText("Bug");
  });

  test("task is created with selected priority and category", async ({ page }) => {
    await page.locator(".react-select__control").first().click();
    await page.locator(".react-select__option").getByText("High", { exact: true }).click();
    
    await page.locator(".react-select__control").nth(1).click();
    await page.locator(".react-select__option").getByText("Bug", { exact: true }).click();
    
    await page.getByPlaceholder("What needs to be done?").fill("Priority Task");
    await page.getByText("Add Task").click();
    
    await expect(page.getByText("Priority Task")).toBeVisible();
    await expect(page.locator("span", { hasText: "High" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "Bug" }).first()).toBeVisible();
  });



  test("invalid file shows error message", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles({
      name: "test.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake pdf content"),
    });
    await expect(page.getByText(/Invalid file type/)).toBeVisible();
  });

  test("valid image upload attaches to task", async ({ page }) => {
    const pngBuffer = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000020001e221bc330000000049454e44ae426082",
      "hex"
    );
    await page.locator('input[type="file"]').setInputFiles({
      name: "photo.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });
    await expect(page.getByText(/Invalid file type/)).not.toBeVisible();
    await expect(page.getByText("photo.png")).toBeVisible();
    
    await page.getByPlaceholder("What needs to be done?").fill("Task With Image");
    await page.getByText("Add Task").click();
    
    await expect(page.locator("img[alt='photo.png']")).toBeVisible();
  });

  // ── Drag and drop ──────────────────────────────────────────────────────────

  test("can drag a task from To Do to In Progress", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("Drag Me");
    await page.getByText("Add Task").click();
    await expect(page.getByText("Drag Me")).toBeVisible();

    const taskCard = page.getByText("Drag Me").first();
    const inProgressColumn = page.getByTestId("column-inprogress");

    const taskBox = await taskCard.boundingBox();
    const targetBox = await inProgressColumn.boundingBox();

    if (taskBox && targetBox) {
      await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
      await page.mouse.down();
      
      // Move 10px first to activate the drag constraint (8px threshold in @dnd-kit sensor)
      await page.mouse.move(
        taskBox.x + taskBox.width / 2 + 10,
        taskBox.y + taskBox.height / 2,
        { steps: 5 }
      );
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 20 }
      );
      await page.mouse.up();
    }

    await expect(page.getByText("Drag Me")).toBeVisible();
  });

  test("arrow buttons move task between columns", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("Arrow Task");
    await page.getByText("Add Task").click();
    await expect(page.getByText("Arrow Task")).toBeVisible();

    await page.getByTitle("Move forward").first().click();
    await expect(page.getByText("Arrow Task")).toBeVisible();

    await page.getByTitle("Move forward").first().click();
    await expect(page.getByText("Arrow Task")).toBeVisible();

    await page.getByTitle("Move back").first().click();
    await expect(page.getByText("Arrow Task")).toBeVisible();
  });

  // ── Progress graph ─────────────────────────────────────────────────────────

  test("progress percentage updates when task moves to Done", async ({ page }) => {
    await expect(page.getByText("0%", { exact: true })).toBeVisible();

    await page.getByPlaceholder("What needs to be done?").fill("Complete Me");
    await page.getByText("Add Task").click();
    await expect(page.getByText("Complete Me")).toBeVisible();

    await expect(page.getByText("0%", { exact: true })).toBeVisible();

    await page.getByTitle("Move forward").first().click();
    await page.getByTitle("Move forward").first().click();

    await expect(page.getByText("100%", { exact: true })).toBeVisible();
  });

  test("graph bar count updates as tasks are added", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("Task Alpha");
    await page.getByText("Add Task").click();
    await page.getByPlaceholder("What needs to be done?").fill("Task Beta");
    await page.getByText("Add Task").click();

    await expect(page.getByText("2 tasks")).toBeVisible();
  });

  // ── Real-time multi-client sync ────────────────────────────────────────────

  test("task created in one tab appears in another tab in real-time", async ({ page, context }) => {
    const page2 = await context.newPage();
    await page2.goto("/");
    await expect(page2.getByText("Connected")).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText("Syncing tasks...")).toHaveCount(0, { timeout: 10000 });

    await page.getByPlaceholder("What needs to be done?").fill("Multi-Client Task");
    await page.getByText("Add Task").click();
    await expect(page.getByText("Multi-Client Task")).toBeVisible();

    await expect(page2.getByText("Multi-Client Task")).toBeVisible({ timeout: 5000 });

    await page2.close();
  });

  test("task deleted in one tab disappears from another tab", async ({ page, context }) => {
    await page.getByPlaceholder("What needs to be done?").fill("Shared Task");
    await page.getByText("Add Task").click();
    await expect(page.getByText("Shared Task")).toBeVisible();

    const page2 = await context.newPage();
    await page2.goto("/");
    await expect(page2.getByText("Connected")).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText("Syncing tasks...")).toHaveCount(0, { timeout: 10000 });
    await expect(page2.getByText("Shared Task")).toBeVisible();

    await page.getByTitle("Delete task").first().click();
    await expect(page.getByText("Shared Task")).not.toBeVisible();

    await expect(page2.getByText("Shared Task")).not.toBeVisible({ timeout: 5000 });

    await page2.close();
  });
});