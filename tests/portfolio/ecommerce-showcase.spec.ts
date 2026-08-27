import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const portfolioEmail = process.env.PORTFOLIO_USER_EMAIL;
const portfolioPassword = process.env.PORTFOLIO_USER_PASSWORD;
const usesManagedCredentials = Boolean(portfolioEmail && portfolioPassword);

type TestUser = { email: string; password: string; ephemeral: boolean };

async function visualBeat(page: Page) {
  // Portfolio-only pause: lets viewers read a completed validation without slowing the normal suite.
  await page.waitForTimeout(1_200);
}

async function createEphemeralUser(request: APIRequestContext): Promise<TestUser> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const user = {
    email: `agentic-qa-${uniqueId}@example.com`,
    password: `Portfolio-${uniqueId}`,
    ephemeral: true,
  };
  const response = await request.post('https://automationexercise.com/api/createAccount', {
    form: {
      name: 'Agentic QA Showcase', email: user.email, password: user.password,
      title: 'Mrs', birth_date: '10', birth_month: '5', birth_year: '1990',
      firstname: 'Agentic', lastname: 'QA', company: 'QA Lab',
      address1: '100 Test Avenue', address2: 'Automation Suite', country: 'United States',
      zipcode: '10001', state: 'New York', city: 'New York', mobile_number: '5550101234',
    },
  });
  expect(response.ok(), 'The disposable user request should succeed').toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ responseCode: 201 });
  return user;
}

async function deleteEphemeralUser(request: APIRequestContext, user: TestUser | undefined) {
  if (!user?.ephemeral) return;
  const response = await request.delete('https://automationexercise.com/api/deleteAccount', {
    form: { email: user.email, password: user.password },
  });
  expect(response.ok(), 'The disposable showcase user should be removed').toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ responseCode: 200 });
}

test('[PORTFOLIO][E2E] customer finds a product and reviews it at checkout', async ({ page, request }) => {
  test.setTimeout(90_000);
  let user: TestUser | undefined;

  try {
    await page.route(/(googleads|googlesyndication|doubleclick|adtrafficquality)/, (route) => route.abort());
    user = usesManagedCredentials
      ? { email: portfolioEmail!, password: portfolioPassword!, ephemeral: false }
      : await createEphemeralUser(request);
    const activeUser = user;

    await test.step('Open the storefront and sign in', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Automation Exercise/);
      await expect(page.getByRole('link', { name: /Home/ })).toBeVisible();
      await visualBeat(page);
      await page.getByRole('link', { name: /Signup \/ Login/ }).click();
      await expect(page.getByRole('heading', { name: 'Login to your account' })).toBeVisible();
      await page.locator('form').filter({ hasText: 'Login' }).getByPlaceholder('Email Address').fill(activeUser.email);
      await page.getByPlaceholder('Password').fill(activeUser.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page.getByText('Logged in as')).toContainText('Agentic QA Showcase');
      await visualBeat(page);
    });

    await test.step('Search for Blue Top', async () => {
      await page.getByRole('link', { name: /Products/ }).click();
      await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
      await page.getByPlaceholder('Search Product').fill('Blue Top');
      await page.locator('#submit_search').click();
      await expect(page.getByRole('heading', { name: 'Searched Products' })).toBeVisible();
      const result = page.locator('.product-image-wrapper').filter({ hasText: 'Blue Top' }).first();
      await expect(result).toContainText('Rs. 500');
      await result.scrollIntoViewIfNeeded();
      await visualBeat(page);
      await result.getByRole('link', { name: 'View Product' }).click();
    });

    await test.step('Validate product details and add it to the cart', async () => {
      const details = page.locator('.product-information');
      await expect(details.getByRole('heading', { name: 'Blue Top' })).toBeVisible();
      await expect(details).toContainText('Rs. 500');
      await expect(details).toContainText('Availability: In Stock');
      await visualBeat(page);
      await page.getByRole('button', { name: /Add to cart/ }).click();
      await expect(page.getByRole('heading', { name: 'Added!' })).toBeVisible();
      await expect(page.getByText('Your product has been added to cart.')).toBeVisible();
      await visualBeat(page);
      await page.getByRole('link', { name: 'View Cart' }).click();
    });

    await test.step('Validate the cart and safely reach checkout', async () => {
      await expect(page.getByText('Shopping Cart', { exact: true })).toBeVisible();
      const cartRow = page.locator('#cart_info tbody tr').filter({ hasText: 'Blue Top' });
      await expect(cartRow.getByRole('link', { name: 'Blue Top' })).toBeVisible();
      await expect(cartRow).toContainText('Rs. 500');
      await expect(cartRow.getByRole('button', { name: '1' })).toBeVisible();
      await visualBeat(page);
      await page.getByText('Proceed To Checkout').click();
      await expect(page.getByText('Address Details', { exact: true })).toBeVisible();
      await expect(page.getByText('Review Your Order', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Blue Top' })).toBeVisible();
      await expect(page.getByText('Agentic QA Showcase').first()).toBeVisible();
      await visualBeat(page);
    });

    await test.step('Show a clear PASS result', async () => {
      await page.evaluate(() => {
        const banner = document.createElement('div');
        banner.setAttribute('role', 'status');
        banner.textContent = 'PASS — Product, cart and checkout validations completed';
        Object.assign(banner.style, {
          position: 'fixed', inset: 'auto 24px 24px 24px', zIndex: '2147483647',
          padding: '18px 24px', borderRadius: '12px', background: '#137333', color: '#fff',
          font: '700 20px Arial, sans-serif', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,.35)',
        });
        document.body.appendChild(banner);
      });
      await expect(page.getByRole('status')).toContainText('PASS');
      await visualBeat(page);
    });
  } finally {
    const video = page.video();
    await page.close();
    if (video) {
      const evidenceDir = path.resolve('evidence/videos');
      await mkdir(evidenceDir, { recursive: true });
      await video.saveAs(path.join(evidenceDir, 'ecommerce-showcase.webm'));
    }
    await deleteEphemeralUser(request, user);
  }
});
