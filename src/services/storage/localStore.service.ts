import { MMKV } from 'react-native-mmkv';

class LocalStoreService {
  private store: MMKV;
  private static instance: LocalStoreService;

  private readonly KEY_API_TOKEN = 'apiToken';
  private readonly KEY_THEME = 'theme';
  private readonly KEY_SYSTEM_LANGUAGE = 'systemLanguage';

  private constructor() {
    this.store = new MMKV();
  }

  public static getInstance(): LocalStoreService {
    if (!LocalStoreService.instance) {
      LocalStoreService.instance = new LocalStoreService();
    }
    return LocalStoreService.instance;
  }

  // Remove legacy boilerplate tokens; new credentials must never be persisted here.
  public clearApiToken(): void {
    this.store.delete(this.KEY_API_TOKEN);
  }

  public getTheme(): string {
    return this.store.getString(this.KEY_THEME) ?? 'system';
  }

  public setTheme(theme: string): void {
    this.store.set(this.KEY_THEME, theme);
  }

  public getSystemLanguage(): string {
    return this.store.getString(this.KEY_SYSTEM_LANGUAGE) ?? 'vi';
  }

  public setSystemLanguage(language: string): void {
    this.store.set(this.KEY_SYSTEM_LANGUAGE, language);
  }

  // Clear all data
  public clearAll(): void {
    this.store.clearAll();
  }
}

const localStore = LocalStoreService.getInstance();
export default localStore;
