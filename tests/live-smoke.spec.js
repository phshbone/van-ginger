const { test, expect } = require("@playwright/test");

test("two-dog sitter lifecycle persists across reload", async ({ page }) => {
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.message));

  await page.goto("index.html");
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


test("guided medication entry uses presets, AM/PM timing, and native time fields", async ({ page }) => {
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.message));

  await page.goto("index.html");
  await page.getByRole("button",{name:"Open care app"}).click();
  await page.locator('.nav[data-screen="medications"]').click();

  await page.locator("#treatmentName").fill("Test Medicine");
  await page.locator("#treatmentDosage").fill("1 tablet");
  await page.locator("#treatmentFrequencyChoice").selectOption({label:"Once daily"});
  await page.locator("#treatmentDaypartChoice").selectOption({label:"Evening (PM)"});
  await page.locator("#treatmentExactTime").fill("19:00");
  await page.locator("#treatmentDue").fill("2026-10-03");
  await page.locator("#treatmentDueTime").fill("19:00");
  await page.locator("#treatmentInstructions").fill("Give with food.");
  await page.getByRole("button",{name:"Add medication or treatment"}).click();

  const card=page.locator(".medication-entry").first();
  await expect(card).toContainText("Test Medicine");
  await expect(card).toContainText("Dosage");
  await expect(card).toContainText("1 tablet");
  await expect(card).toContainText("Once daily");
  await expect(card).toContainText("Evening · 7:00 PM");
  await expect(card).toContainText("Next due");
  await expect(card).toContainText("7:00 PM");
  await expect(card).toContainText("Give with food.");

  await card.getByRole("button",{name:"Edit"}).click();
  await page.locator("#treatmentFrequencyChoice").selectOption({label:"Other"});
  await expect(page.locator("#treatmentFrequencyOtherWrap")).not.toHaveClass(/hidden/);
  await page.locator("#treatmentFrequencyOther").fill("Every 36 hours");
  await page.getByRole("button",{name:"Save changes"}).click();
  await expect(page.locator(".medication-entry").first()).toContainText("Every 36 hours");

  await page.getByRole("button",{name:"More"}).click();
  await page.getByRole("button",{name:"Sitter",exact:true}).click();
  await page.getByRole("button",{name:"Preview sitter view"}).click();
  await expect(page.locator("#sitterViewContent")).toContainText("Test Medicine");
  await expect(page.locator("#sitterViewContent")).toContainText("Evening · 7:00 PM");
  await expect(page.locator("#sitterViewContent")).toContainText("Next due");

  expect(pageErrors).toEqual([]);
});


test("phone footer anchors to viewport with dark underfill and larger controls", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("phone"),"mobile-only footer check");

  await page.goto("index.html");
  await page.getByRole("button",{name:"Open care app"}).click();

  await page.locator('.dog-tab[data-dog="ginger"]').click();

  const metrics=await page.evaluate(()=>{
    const el=document.querySelector(".bottom-nav");
    const nav=el.querySelector(".nav");
    const icon=el.querySelector(".nav-icon");
    const rect=el.getBoundingClientRect();
    const root=getComputedStyle(document.documentElement);
    const body=getComputedStyle(document.body);
    const after=getComputedStyle(el,"::after");
    return {
      bottom:rect.bottom,
      viewport:window.innerHeight,
      rootBackground:root.backgroundColor,
      bodyBackground:body.backgroundColor,
      underfillHeight:parseFloat(after.height),
      underfillBackground:after.backgroundColor,
      navFont:parseFloat(getComputedStyle(nav).fontSize),
      iconFont:parseFloat(getComputedStyle(icon).fontSize)
    };
  });

  expect(Math.abs(metrics.bottom-metrics.viewport)).toBeLessThan(2);
  expect(metrics.underfillHeight).toBeGreaterThanOrEqual(139);
  expect(metrics.rootBackground).toBe(metrics.underfillBackground);
  expect(metrics.bodyBackground).toBe(metrics.underfillBackground);
  expect(metrics.navFont).toBeGreaterThanOrEqual(12);
  expect(metrics.iconFont).toBeGreaterThanOrEqual(20);
  await expect(page.locator('.nav[data-screen="more"]')).toBeVisible();
  await page.locator('.nav[data-screen="more"]').click();
  await expect(page.locator("#more")).toHaveClass(/active/);
});
