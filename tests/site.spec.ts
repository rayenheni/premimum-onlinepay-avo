import { test, expect, type Page } from "@playwright/test";

const E2E = "e2e-" + Date.now().toString(36);
const ADMIN_EMAIL = `${E2E}-admin@example.tn`;
const ADMIN_PASSWORD = "Test-Password-2026!";

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("Home: Tunisian office hero, intro video and screenshots", async ({ page, request }) => {
  const errors = trackErrors(page);
  await page.setViewportSize({ width: 1920, height: 940 });
  const response = await page.goto("/ar");
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".law-site")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".hero-copy h1")).toContainText("حقوقك أمانة");
  const heroSrc = await page.locator(".hero-background").getAttribute("src");
  expect(decodeURIComponent(heroSrc || "")).toContain("office-tunisia");
  await expect(page.locator(".hero-preview img")).toHaveAttribute("src", /video-poster/);
  await page.screenshot({ path: "artifacts/desktop-hero.png" });

  await page.locator(".hero-preview").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("video")).toBeVisible();
  await expect(dialog.locator("video")).toHaveAttribute("src", "/videos/intro.mp4");
  const video = await request.get("/videos/intro.mp4", { headers: { Range: "bytes=0-1023" } });
  expect([200, 206]).toContain(video.status());
  expect(video.headers()["content-type"]).toContain("video/mp4");
  await page.screenshot({ path: "artifacts/desktop-video.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(page.locator(".site-header")).toHaveClass(/header-scrolled/);
  await expect(page.locator(".stat-card")).toHaveCount(8);
  await expect(page.locator(".journey-timeline li")).toHaveCount(7);
  await expect(page.locator(".practice-card")).toHaveCount(2);
  expect(errors).toEqual([]);
});

test("Every public page renders in Arabic and French", async ({ page }) => {
  const errors = trackErrors(page);
  const paths = ["", "/about", "/services", "/services/corporate", "/services/property", "/blog", "/blog/premiere-consultation", "/contact", "/careers", "/book", "/search?q=immobilier", "/privacy", "/legal"];
  for (const locale of ["ar", "fr"]) {
    for (const path of paths) {
      const response = await page.goto(`/${locale}${path}`);
      expect(response?.status(), `${locale}${path}`).toBe(200);
      await expect(page.locator("h1").first(), `${locale}${path}`).toBeVisible();
      await expect(page.locator(".law-site")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    }
  }
  expect(errors).toEqual([]);
  await page.goto("/fr/services/property");
  await page.screenshot({ path: "artifacts/french-service.png" });
  await page.goto("/ar/about");
  await page.screenshot({ path: "artifacts/arabic-about.png" });
});

test("Unknown pages return 404 and root redirects to Arabic", async ({ page, request }) => {
  expect((await request.get("/ar/services/not-a-service")).status()).toBe(404);
  expect((await request.get("/ar/blog/not-an-article")).status()).toBe(404);
  expect((await request.get("/xx")).status()).toBe(404);
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/);
});

test("Navigation, language switch on inner pages and search", async ({ page }) => {
  await page.goto("/ar/services/property");
  await page.locator(".language-button").click();
  await page.getByRole("link", { name: /Français/ }).click();
  await expect(page).toHaveURL(/\/fr\/services\/property$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator(".page-hero h1")).toHaveText("Droit immobilier");
  await page.locator(".primary-navigation").getByRole("link", { name: "Le cabinet" }).click();
  await expect(page).toHaveURL(/\/fr\/about$/);
  await page.locator(".header-search").click();
  await expect(page).toHaveURL(/\/fr\/search$/);
  await page.getByRole("searchbox").or(page.locator("input[name=q]")).fill("contrat");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/q=contrat/);
  await page.locator(".search-results").getByRole("link", { name: /Contrats et conseil/ }).first().click();
  await expect(page).toHaveURL(/\/fr\/services\/contracts$/);
});

test("Contact and booking requests are saved", async ({ page }) => {
  await page.goto("/fr/contact");
  await page.getByLabel(/Nom et prénom/).fill(`${E2E} Contact`);
  await page.getByLabel(/Adresse e-mail/).fill(`${E2E}-contact@example.tn`);
  await page.getByLabel(/Votre message/).fill("Message de vérification automatisé.");
  await page.getByLabel(/J’accepte le traitement/).check();
  await page.getByRole("button", { name: "Envoyer mon message" }).click();
  await expect(page.locator(".request-reference strong")).toHaveText(/^MSG-[A-F0-9]{16}$/);

  await page.goto("/fr/book?service=contracts");
  await page.getByLabel(/Nom et prénom/).fill(`${E2E} Booking`);
  await page.getByLabel(/Adresse e-mail/).fill(`${E2E}-booking@example.tn`);
  await page.getByLabel(/Téléphone/).fill("+216 20 000 000");
  await expect(page.getByLabel(/Domaine de consultation/)).toHaveValue("contracts");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByLabel(/Consultation approfondie/).check();
  await page.getByLabel(/e-Dinar/).check();
  await expect(page.locator(".checkout-total")).toContainText("150");
  if (!(await page.locator(".payment-notice").isVisible())) test.skip(true, "Merchant account configured.");
  await page.getByLabel(/J’accepte le traitement/).check();
  await page.getByRole("button", { name: "Enregistrer ma demande", exact: true }).click();
  await expect(page.locator(".request-reference strong")).toHaveText(/^AYL-[A-F0-9]{16}$/);
  await expect(page.locator(".success-screen")).toContainText("Aucun montant n’a été débité");
});

test("Admin: setup, protected pages, manage content and requests", async ({ page, request }) => {
  const errors = trackErrors(page);
  await page.setViewportSize({ width: 1440, height: 940 });
  // Unauthenticated access is redirected.
  await page.goto("/admin/articles");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Première installation" })).toBeVisible();
  await page.screenshot({ path: "artifacts/admin-setup.png" });

  // First-time setup creates the account and signs in.
  await page.getByLabel("Adresse e-mail").fill(ADMIN_EMAIL);
  await page.getByLabel(/^Mot de passe/).fill(ADMIN_PASSWORD);
  await page.getByLabel("Confirmer le mot de passe").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Créer le compte administrateur" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  await page.screenshot({ path: "artifacts/admin-dashboard.png" });

  // Seed a consultation and a message through the public API.
  const booking = await request.post("/api/consultations", { data: { fullName: `${E2E} Client`, email: `${E2E}-client@example.tn`, phone: "+216 20 111 222", service: "property", amount: 250, paymentMethod: "card", locale: "fr", consent: true } });
  expect(booking.status()).toBe(201);
  const message = await request.post("/api/inquiries", { data: { fullName: `${E2E} Writer`, email: `${E2E}-writer@example.tn`, message: "Bonjour, ceci est un test.", kind: "career", locale: "fr", consent: true } });
  expect(message.status()).toBe(201);

  // Consultation status.
  await page.goto("/admin/consultations");
  const card = page.locator("article", { hasText: `${E2E}-client@example.tn` });
  await expect(card).toContainText("Droit immobilier");
  await card.locator("select[name=status]").selectOption("confirmed");
  await card.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(page.locator("article", { hasText: `${E2E}-client@example.tn` }).locator(".adm-badge").first()).toHaveText("RDV confirmé");

  // Message handling.
  await page.goto("/admin/messages");
  const msg = page.locator("article", { hasText: `${E2E}-writer@example.tn` });
  await expect(msg).toContainText("Candidature");
  await msg.getByRole("button", { name: "Marquer comme traité" }).click();
  await expect(page.locator("article", { hasText: `${E2E}-writer@example.tn` }).getByRole("button", { name: "Marquer comme nouveau" })).toBeVisible();

  // Validation: an article needs a title and content.
  await page.goto("/admin/articles/new");
  await page.getByRole("button", { name: "Enregistrer l’article" }).click();
  await expect(page.locator(".adm-error")).toContainText("au moins un titre");

  // Create an article; it appears publicly in both languages.
  const slug = `${E2E}-article`;
  await page.getByLabel(/Lien de l’article/).fill(slug);
  await page.locator("input[name=titleFr]").fill("Article de test automatisé");
  await page.locator("input[name=titleAr]").fill("مقال تجريبي آلي");
  await page.locator("textarea[name=bodyFr]").fill("Premier paragraphe de test.\n\nSecond paragraphe de test.");
  await page.locator("textarea[name=bodyAr]").fill("فقرة أولى للاختبار.\n\nفقرة ثانية للاختبار.");
  await page.getByRole("button", { name: "Enregistrer l’article" }).click();
  await expect(page).toHaveURL(/\/admin\/articles\?saved=1/);
  await expect(page.getByText("Article enregistré.")).toBeVisible();
  await page.goto(`/fr/blog/${slug}`);
  await expect(page.locator(".page-hero h1")).toHaveText("Article de test automatisé");
  await expect(page.locator(".article-page")).toContainText("Second paragraphe de test.");
  await page.goto(`/ar/blog/${slug}`);
  await expect(page.locator(".page-hero h1")).toHaveText("مقال تجريبي آلي");
  await page.goto("/fr/blog");
  await expect(page.getByRole("link", { name: "Article de test automatisé" }).first()).toBeVisible();

  // Unpublish hides it.
  await page.goto("/admin/articles");
  await page.locator("article", { hasText: slug }).getByRole("link", { name: "Modifier" }).click();
  await page.getByLabel("Publié sur le site").uncheck();
  await page.getByRole("button", { name: "Enregistrer l’article" }).click();
  await expect(page).toHaveURL(/\/admin\/articles\?saved=1/);
  await expect(page.locator("article", { hasText: slug }).locator(".adm-badge")).toHaveText("Brouillon");
  expect((await request.get(`/fr/blog/${slug}`)).status()).toBe(404);

  // Settings are validated and reflected publicly.
  await page.goto("/admin/settings");
  await page.locator("input[name=contactPhone]").fill("abc");
  await page.getByRole("button", { name: "Enregistrer les paramètres", exact: true }).click();
  await expect(page.locator(".adm-error")).toContainText("Numéro de téléphone invalide");
  await page.locator("input[name=contactEmail]").fill(`${E2E}-cabinet@example.tn`);
  await page.locator("input[name=address]").fill("Avenue de test, Tunis");
  await page.getByRole("button", { name: "Enregistrer les paramètres", exact: true }).click();
  await expect(page.getByText("Paramètres enregistrés.")).toBeVisible();
  await page.screenshot({ path: "artifacts/admin-settings.png" });
  await page.goto("/fr/contact");
  await expect(page.locator(".info-card")).toContainText(`${E2E}-cabinet@example.tn`);
  await expect(page.locator(".site-footer")).toContainText("Avenue de test, Tunis");

  // Global bilingual text editor publishes instantly.
  await page.goto("/admin/content");
  await page.locator('input[name="fr:content:hero.title"]').fill("Titre CMS de vérification");
  await page.getByRole("button", { name: "Enregistrer tous les textes" }).click();
  await expect(page).toHaveURL(/\/admin\/content\?saved=1/);
  await page.goto("/fr");
  await expect(page.locator(".hero-copy h1")).toContainText("Titre CMS de vérification");

  // Media upload, public gallery and image-slot assignment.
  await page.goto("/admin/media");
  await page.locator('input[name="file"]').setInputFiles("public/images/article-family.jpg");
  await page.locator('input[name="altFr"]').fill("Image E2E du cabinet");
  await page.locator('input[name="showInGallery"]').check();
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.getByText("Image importée.")).toBeVisible();
  const mediaPath = (await page.locator(".adm-media code").first().innerText()).trim();
  expect(mediaPath).toMatch(/^\/media\/\d+$/);
  await page.goto("/admin/appearance");
  await page.locator('input[name="heroImage"]').fill(mediaPath);
  await page.getByRole("button", { name: "Enregistrer l’apparence" }).click();
  await expect(page).toHaveURL(/\/admin\/appearance\?saved=1/);
  await page.goto("/fr");
  await expect(page.locator(".hero-background")).toHaveAttribute("src", mediaPath);
  await page.goto("/fr/gallery");
  await expect(page.getByAltText("Image E2E du cabinet")).toBeVisible();

  // Page publication controls really disable routes.
  await page.goto("/admin/pages");
  const careersPanel = page.locator("details", { hasText: "Carrières" });
  await careersPanel.locator("summary").click();
  await careersPanel.locator('input[name="enabled:careers"]').uncheck();
  await page.getByRole("button", { name: "Enregistrer les pages" }).click();
  await expect(page).toHaveURL(/\/admin\/pages\?saved=1/);
  expect((await page.request.get("/fr/careers")).status()).toBe(404);
  await page.goto("/fr");
  await expect(page.locator(".site-header").getByRole("link", { name: "Carrières" })).toHaveCount(0);

  // The freelance estimate is private, not part of the client's administration.
  expect((await page.goto("/admin/valuation"))?.status()).toBe(404);
  await page.goto("/admin/audit");
  await expect(page.locator(".adm-sidebar").getByText("Valorisation")).toHaveCount(0);
  const exportResult = await page.evaluate(async () => {
    const response = await fetch("/api/admin/export?type=consultations");
    return { ok: response.ok, type: response.headers.get("content-type") || "" };
  });
  expect(exportResult.ok).toBeTruthy();
  expect(exportResult.type).toContain("text/csv");
  await page.goto("/admin/audit");
  await expect(page.locator(".adm-table")).toContainText("content.update");
  await expect(page.locator(".adm-table")).toContainText("media.upload");

  // Logout and login.
  await page.goto("/admin");
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/consultations");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Adresse e-mail").fill(ADMIN_EMAIL);
  await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator(".adm-error")).toContainText("Identifiants incorrects");
  await page.getByLabel("Mot de passe").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // Changing the private admin path hides /admin immediately while preserving the session.
  const privatePath = `cabinet-secure-${Date.now().toString(36)}`;
  await page.goto("/admin/settings");
  await page.locator('input[name="adminPath"]').fill(privatePath);
  await page.getByRole("button", { name: "Changer l’adresse d’administration" }).click();
  await expect(page).toHaveURL(new RegExp(`/${privatePath}/settings`));
  expect(new URL(page.url()).searchParams.get("changed")).toBe("path");
  await expect(page.getByText(`/${privatePath}`, { exact: false }).first()).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto(`/${privatePath}/audit`);
  await expect(page.getByRole("heading", { name: "Journal de sécurité" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Mobile layouts, menu navigation and no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/ar", "/fr", "/ar/services", "/fr/contact", "/ar/blog", "/fr/book"]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBeTruthy();
  }
  await page.goto("/ar");
  await page.screenshot({ path: "artifacts/mobile-arabic.png" });
  await page.locator(".mobile-menu-toggle").click();
  await page.locator(".mobile-navigation").getByRole("link", { name: "الخدمات" }).click();
  await expect(page).toHaveURL(/\/ar\/services$/);
  await expect(page.locator(".mobile-navigation")).toHaveCount(0);
  await page.goto("/ar/admin-nope");
});

test("APIs reject invalid requests", async ({ playwright, baseURL }) => {
  const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { "x-real-ip": `api-${Date.now()}` } });
  expect((await request.post("/api/consultations", { data: { fullName: "x", email: "bad", phone: "1", service: "contracts", amount: 1, paymentMethod: "card" } })).status()).toBe(400);
  expect((await request.post("/api/inquiries", { data: { fullName: "x", email: "bad", message: "x" } })).status()).toBe(400);
  expect((await request.get("/api/payments/konnect?payment_ref=invalid")).status()).toBe(400);
  expect((await request.get("/api/health")).ok()).toBeTruthy();
});

test("Bug-fix regressions: Arabic search variants, styled 404, original assets", async ({ page, request }) => {
  await page.goto("/ar/search?q=" + encodeURIComponent("الاسرة"));
  await expect(page.locator(".search-results")).toContainText("قانون الأسرة");
  const missing = await page.goto("/fr/services/inexistant");
  expect(missing?.status()).toBe(404);
  await expect(page.locator(".not-found-page h1")).toHaveText("Page introuvable");
  for (const asset of ["/fonts/sst-roman.ttf", "/images/article-family.webp", "/images/office.jpg"]) {
    expect((await request.get(asset)).status(), asset).toBe(404);
  }
  for (const asset of ["/images/justice.png", "/images/article-family.jpg", "/images/office-tunisia.jpg", "/videos/intro.mp4"]) {
    expect((await request.get(asset, { headers: { Range: "bytes=0-10" } })).status(), asset).toBeLessThan(300);
  }
  const html = await (await request.get("/ar")).text();
  expect(html).not.toContain("نمثلك بثقة");
  expect(html).not.toContain("SST Arabic");
});

test("Public forms are rate limited", async ({ request }) => {
  const statuses: number[] = [];
  const ip = `rl-${Date.now()}-${Math.random()}`;
  for (let i = 0; i < 12; i++) {
    statuses.push((await request.post("/api/inquiries", { headers: { "x-real-ip": ip }, data: { fullName: "x", email: "bad", message: "x" } })).status());
  }
  expect(statuses.slice(0, 8).every((s) => s === 400)).toBeTruthy();
  expect(statuses.at(-1)).toBe(429);
});
