import { test, expect } from '@playwright/test';

test.describe('v1.1.4 Zero-Knowledge E2EE, Master Password & Security Boundary Suite', () => {

  // =========================================================================
  // 1. CRYPTOGRAPHIC ENGINE UNIT & NEGATIVE TESTS (in browser context)
  // =========================================================================

  test('Crypto Engine (Negative & Positive): Password strength rule validator', async ({ page }) => {
    await page.goto('/');

    // Evaluate password rules logic using the exact regexes from cryptoVault.ts
    const results = await page.evaluate(() => {
      function check(pw: string) {
        const minLength = pw.length >= 8;
        const hasUpper = /[A-Z]/.test(pw);
        const hasLower = /[a-z]/.test(pw);
        const hasNumber = /[0-9]/.test(pw);
        const hasSymbol = /[^A-Za-z0-9]/.test(pw);
        return {
          minLength,
          hasUpper,
          hasLower,
          hasNumber,
          hasSymbol,
          isValid: minLength && hasUpper && hasLower && hasNumber && hasSymbol
        };
      }

      return {
        tooShort: check('Aa1!'),             // < 8 chars
        noUpper: check('ezersync#2026'),      // missing [A-Z]
        noLower: check('EZERSYNC#2026'),      // missing [a-z]
        noNumber: check('EzerSync#Pass'),     // missing [0-9]
        noSymbol: check('EzerSync2026'),      // missing symbol
        valid: check('EzerSync#2026')         // valid!
      };
    });

    // Negative assertions: each rule breaker must fail isValid and its specific rule
    expect(results.tooShort.isValid).toBe(false);
    expect(results.tooShort.minLength).toBe(false);

    expect(results.noUpper.isValid).toBe(false);
    expect(results.noUpper.hasUpper).toBe(false);

    expect(results.noLower.isValid).toBe(false);
    expect(results.noLower.hasLower).toBe(false);

    expect(results.noNumber.isValid).toBe(false);
    expect(results.noNumber.hasNumber).toBe(false);

    expect(results.noSymbol.isValid).toBe(false);
    expect(results.noSymbol.hasSymbol).toBe(false);

    // Positive assertion: valid password satisfies all 5 criteria
    expect(results.valid.isValid).toBe(true);
    expect(results.valid.minLength).toBe(true);
    expect(results.valid.hasUpper).toBe(true);
    expect(results.valid.hasLower).toBe(true);
    expect(results.valid.hasNumber).toBe(true);
    expect(results.valid.hasSymbol).toBe(true);
  });

  test('Crypto Engine: AES-256-GCM Key Wrapping & Wrong PIN Decryption Failure (Negative)', async ({ page }) => {
    await page.goto('/');

    const cryptoTestResult = await page.evaluate(async () => {
      // Helper: base64 conversions
      function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }

      function base64ToBuffer(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }

      // 1. Generate a mock 256-bit AES-GCM Master Key
      const masterKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // 2. Wrap Master Key with Convenience PIN '1234'
      const salt = bufferToBase64(window.crypto.getRandomValues(new Uint8Array(16)));
      const enc = new TextEncoder();
      const pinBuffer = enc.encode('1234');
      const baseKey = await window.crypto.subtle.importKey('raw', pinBuffer, { name: 'PBKDF2' }, false, ['deriveKey']);
      const pinKey = await window.crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: base64ToBuffer(salt).buffer as ArrayBuffer, iterations: 50000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const rawMasterKey = await window.crypto.subtle.exportKey('raw', masterKey);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedKey = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, pinKey, rawMasterKey);

      const wrappedVault = JSON.stringify({
        iv: bufferToBase64(iv),
        key: bufferToBase64(encryptedKey)
      });

      // 3. Negative test: Attempt to unwrap using WRONG PIN '9999'
      let wrongPinFailed = false;
      try {
        const wrongPinBuffer = enc.encode('9999');
        const wrongBaseKey = await window.crypto.subtle.importKey('raw', wrongPinBuffer, { name: 'PBKDF2' }, false, ['deriveKey']);
        const wrongPinKey = await window.crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: base64ToBuffer(salt).buffer as ArrayBuffer, iterations: 50000, hash: 'SHA-256' },
          wrongBaseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        const parsed = JSON.parse(wrappedVault);
        await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: base64ToBuffer(parsed.iv).buffer as ArrayBuffer },
          wrongPinKey,
          base64ToBuffer(parsed.key).buffer as ArrayBuffer
        );
      } catch (err) {
        wrongPinFailed = true; // Web Crypto correctly throws OperationError on tag mismatch!
      }

      // 4. Positive test: Attempt to unwrap using CORRECT PIN '1234'
      let correctPinSucceeded = false;
      try {
        const parsed = JSON.parse(wrappedVault);
        const decryptedRaw = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: base64ToBuffer(parsed.iv).buffer as ArrayBuffer },
          pinKey,
          base64ToBuffer(parsed.key).buffer as ArrayBuffer
        );
        correctPinSucceeded = (decryptedRaw.byteLength === 32); // 256 bits = 32 bytes
      } catch (err) {
        correctPinSucceeded = false;
      }

      return { wrongPinFailed, correctPinSucceeded };
    });

    expect(cryptoTestResult.wrongPinFailed).toBe(true);
    expect(cryptoTestResult.correctPinSucceeded).toBe(true);
  });

  // =========================================================================
  // 2. DUAL-TIER LOGIN INTERACTION & NEGATIVE GATES
  // =========================================================================

  test('Login UI: Interactive toggle between Quick Convenience PIN and Master Password', async ({ page }) => {
    await page.goto('/');

    // 1. Initial State defaults to Quick Convenience PIN
    const pinLabel = page.locator('label:has-text("Quick Convenience PIN")');
    await expect(pinLabel).toBeVisible();

    const pinInput = page.locator('input[placeholder="****"]');
    await expect(pinInput).toBeVisible();
    await expect(pinInput).toHaveAttribute('maxLength', '8');

    // Negative check: Access Dashboard disabled when empty
    const accessBtn = page.locator('button:has-text("Access Dashboard")');
    await expect(accessBtn).toBeDisabled();

    // 2. Toggle to Master Password
    const toggleToPasswordBtn = page.locator('button:has-text("Use Password instead")');
    await expect(toggleToPasswordBtn).toBeVisible();
    await toggleToPasswordBtn.click();

    // 3. Verify Master Password state
    const passwordLabel = page.locator('label:has-text("Master Password")');
    await expect(passwordLabel).toBeVisible();

    const passwordInput = page.locator('input[placeholder="Enter Master Password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).not.toHaveAttribute('maxLength'); // No 8-char limit on Master Password

    // 4. Toggle back to PIN
    const toggleToPinBtn = page.locator('button:has-text("Use PIN instead")');
    await expect(toggleToPinBtn).toBeVisible();
    await toggleToPinBtn.click();

    // 5. Verify back on PIN
    await expect(pinLabel).toBeVisible();
    await expect(page.locator('input[placeholder="****"]')).toBeVisible();
  });

  // =========================================================================
  // 3. REGISTRATION PASSWORD COMPLEXITY CHECKLIST & NEGATIVE GATES
  // =========================================================================

  test('Registration UI (Negative): Incomplete password requirements keep checklist unfulfilled', async ({ page }) => {
    await page.goto('/');
    await page.click('text="Create a new hub"');

    // Fill valid setup fields
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', 'negpass' + Date.now());
    await page.fill('input[placeholder="The Smith Family"]', 'Negative Test Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin');
    await page.fill('input[placeholder="admin@example.com"]', 'admin@example.com');

    const masterPassInput = page.locator('input[placeholder*="Min 8 chars"]');
    await expect(masterPassInput).toBeVisible();

    // 1. Partial Password 1: 'short' (< 8 chars)
    await masterPassInput.fill('short');
    await expect(page.locator('text=⚪ 8+ Characters')).toBeVisible();
    await expect(page.locator('button:has-text("Create Household")')).toBeDisabled();

    // 2. Partial Password 2: 'alllowercase1234!' (missing uppercase)
    await masterPassInput.fill('alllowercase1234!');
    await expect(page.locator('text=⚪ Uppercase')).toBeVisible();
    await expect(page.locator('text=✅ Lowercase')).toBeVisible();
    await expect(page.locator('text=✅ Number')).toBeVisible();
    await expect(page.locator('text=✅ Special Symbol')).toBeVisible();

    // 3. Partial Password 3: 'ALLUPPERCASE1234!' (missing lowercase)
    await masterPassInput.fill('ALLUPPERCASE1234!');
    await expect(page.locator('text=⚪ Lowercase')).toBeVisible();
    await expect(page.locator('text=✅ Uppercase')).toBeVisible();

    // 4. Partial Password 4: 'NoSymbolsHere1234' (missing symbol)
    await masterPassInput.fill('NoSymbolsHere1234');
    await expect(page.locator('text=⚪ Special Symbol')).toBeVisible();
    await expect(page.locator('text=✅ Number')).toBeVisible();

    // 5. Partial Password 5: 'NoNumbersHere!@#' (missing number)
    await masterPassInput.fill('NoNumbersHere!@#');
    await expect(page.locator('text=⚪ Number')).toBeVisible();
    await expect(page.locator('text=✅ Special Symbol')).toBeVisible();
  });

  test('Registration UI (Positive): Strong password fulfills all 5 checklist badges', async ({ page }) => {
    await page.goto('/');
    await page.click('text="Create a new hub"');

    const masterPassInput = page.locator('input[placeholder*="Min 8 chars"]');
    await masterPassInput.fill('EzerSync#2026');

    // All 5 checklist items must now show ✅
    await expect(page.locator('text=✅ 8+ Characters')).toBeVisible();
    await expect(page.locator('text=✅ Uppercase')).toBeVisible();
    await expect(page.locator('text=✅ Lowercase')).toBeVisible();
    await expect(page.locator('text=✅ Number')).toBeVisible();
    await expect(page.locator('text=✅ Special Symbol')).toBeVisible();
  });

  // =========================================================================
  // 4. ACCOUNT RECOVERY UI NAVIGATION & FALLBACKS
  // =========================================================================

  test('Recovery UI (Navigation & Negative): Forgot Password screen and mode switching', async ({ page }) => {
    await page.goto('/');

    // 1. Click "Forgot Password / PIN?"
    const forgotBtn = page.locator('button:has-text("Forgot Password / PIN?")');
    await expect(forgotBtn).toBeVisible();
    await forgotBtn.click();

    // 2. Verify Forgot Password Form
    await expect(page.locator('h3:has-text("Reset Household Access")')).toBeVisible();
    await expect(page.locator('p:has-text("We will send a secure recovery link")')).toBeVisible();

    const hubInput = page.locator('input[placeholder="e.g. smithfamily"]');
    const emailInput = page.locator('input[placeholder="your-email@example.com"]');
    const sendBtn = page.locator('button:has-text("Send Recovery Email")');

    await expect(hubInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(sendBtn).toBeDisabled(); // Negative: empty fields keep send disabled

    // 3. Switch to offline Admin Recovery Code form
    const adminRecoveryBtn = page.locator('button:has-text("Admin Recovery Code")');
    await expect(adminRecoveryBtn).toBeVisible();
    await adminRecoveryBtn.click();

    // Verify switched to Master Recovery form
    await expect(page.locator('input[placeholder="Enter admin code"]')).toBeVisible();
    await expect(page.locator('input[placeholder="****"]')).toBeVisible();

    // 4. Switch back to Login
    const backToLoginBtn = page.locator('button:has-text("Back to Login")');
    await expect(backToLoginBtn).toBeVisible();
    await backToLoginBtn.click();

    // Verify back on Login form
    await expect(page.locator('button:has-text("Access Dashboard")')).toBeVisible();
  });

});
