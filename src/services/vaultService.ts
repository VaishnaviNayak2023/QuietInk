
import CryptoJS from 'crypto-js';
import { Storage, VaultItem } from './storage';

/**
 * VaultService handles the AES-256 encryption pipeline and secure storage logic.
 * It uses PBKDF2 for key derivation from the user's PIN.
 */
export class VaultService {
  private static SALT_KEY = 'vault_salt_v1';
  private static ITERATIONS = 100000;

  private static async getSalt(): Promise<string> {
    let salt = await Storage.getSetting<string>(this.SALT_KEY);
    if (!salt) {
      salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
      await Storage.saveSetting(this.SALT_KEY, salt);
    }
    return salt;
  }

  private static async deriveKey(pin: string): Promise<string> {
    const salt = await this.getSalt();
    return CryptoJS.PBKDF2(pin, salt, {
      keySize: 256 / 32,
      iterations: this.ITERATIONS
    }).toString();
  }

  /**
   * Verifies if the provided PIN is correct by attempting to decrypt a stored verifier.
   */
  static async verifyPin(pin: string): Promise<boolean> {
    const verifier = await Storage.getSetting<string>('pin_verifier');
    if (!verifier) {
      // If no verifier, we set one (first time use)
      const newVerifier = await this.encrypt("VERIFIED", pin);
      await Storage.saveSetting('pin_verifier', newVerifier);
      return true;
    }
    try {
      const decrypted = await this.decrypt(verifier, pin);
      return decrypted === "VERIFIED";
    } catch {
      return false;
    }
  }

  /**
   * Encrypts a payload using AES-256 with a key derived from the PIN.
   */
  static async encrypt(payload: string, pin: string): Promise<string> {
    const keyHex = await this.deriveKey(pin);
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    const encrypted = CryptoJS.AES.encrypt(payload, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    // Return IV + Encrypted Data for decryption later
    return iv.toString() + encrypted.toString();
  }

  /**
   * Decrypts a payload using AES-256 with a key derived from the PIN.
   */
  static async decrypt(encryptedPayload: string, pin: string): Promise<string> {
    const keyHex = await this.deriveKey(pin);
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const ivString = encryptedPayload.substring(0, 32);
    const dataString = encryptedPayload.substring(32);
    
    const iv = CryptoJS.enc.Hex.parse(ivString);
    const decrypted = CryptoJS.AES.decrypt(dataString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result) throw new Error("Invalid PIN or corrupted data");
    return result;
  }

  /**
   * Creates a new secure entry in the vault.
   */
  static async createEntry(
    type: VaultItem['type'], 
    label: string, 
    content: string, 
    pin: string,
    metadata?: VaultItem['metadata']
  ): Promise<VaultItem> {
    const encryptedPayload = await this.encrypt(content, pin);
    const newItem: VaultItem = {
      id: crypto.randomUUID(),
      type,
      label,
      encryptedPayload,
      timestamp: Date.now(),
      metadata
    };
    await Storage.saveVaultItem(newItem);
    return newItem;
  }

  /**
   * List entries. Does NOT decrypt payloads by default for performance.
   */
  static async listEntries(): Promise<VaultItem[]> {
    return await Storage.getVaultItems();
  }

  /**
   * Search entries based on labels (since they are stored in plaintext for UX filtering).
   * Note: The payload is never searched until decrypted.
   */
  static async searchEntries(query: string): Promise<VaultItem[]> {
    const items = await Storage.getVaultItems();
    const q = query.toLowerCase();
    return items.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.metadata?.tags?.some(tag => tag.toLowerCase().includes(q))
    );
  }

  /**
   * Emergency Wipe: Deletes all vault data.
   */
  static async emergencyWipe() {
    const db = await (await import('./storage')).getDB();
    await db.clear('vault');
    await db.clear('notes');
    await db.clear('contacts');
    await db.clear('notebooks');
    await db.clear('settings'); // Also clear salt/pin settings
  }
}
