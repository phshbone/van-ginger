const { test, expect } = require("@playwright/test");

test("two-dog sitter lifecycle persists across reload", async ({ page }) => {
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.message));

  await page.goto("/index.html");
  await page.getByRole("button",{name:"Open care app"}).click();

  await page.getByRole("button",{name:"More"}).click();
  await page.getByRole("button",{name:"Sitter",exact:true}).click();
  await page.locator("#sitterPotty").fill("Van outside after breakfast and before bed.");
  await page.locator("#sitterSleep").fill("Van sleeps in the den.");
  await page.getByRole("button",{name:"Save instructions"}).click();

  await page.locator('.dog-tab[data-dog="ginger"]').click();
  await page.locator("#sitterPotty").fill("Ginger outside after meals.");
  await page.locator("#sitterInstructions").fill("Keep Ginger on short walks.");
  await page.getByRole("button",{name:"Activate Sitter Mode"}).click();

  await expect(page.locator("#sitterModal")).toHaveClass(/open/);
  await expect(page.locator("#sitterViewContent")).toContainText("Van outside after breakfast");
  await expect(page.locator("#sitterViewContent")).toContainText("Ginger outside after meals");

  await page.locator("#sitterChecklistToggle").check();
  const firstCheck=page.locator("#sitterViewContent input[data-sitter-key]").first();
  await firstCheck.check();
  await expect(firstCheck).toBeChecked();
  await page.getByRole("button",{name:"Close"}).click();

  await page.reload();
  await page.getByRole("button",{name:"Open care app"}).click();
  await expect(page.locator("#sitterEntryAlert")).toHaveClass(/open/);
  await page.getByRole("button",{name:"View instructions"}).click();
  await page.locator("#sitterChecklistToggle").check();
  await expect(page.locator("#sitterViewContent input[data-sitter-key]").first()).toBeChecked();

  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#sitterModalEndBtn").click();
  await expect(page.locator("#sitterModalEndBtn")).toHaveClass(/hidden/);
  await page.getByRole("button",{name:"Close"}).click();

  await page.reload();
  await page.getByRole("button",{name:"Open care app"}).click();
  await expect(page.locator("#sitterEntryAlert")).not.toHaveClass(/open/);

  expect(pageErrors).toEqual([]);
});
