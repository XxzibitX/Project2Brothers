/** POST /v1/auth/login */
export interface LoginDto {
  phone: string;
  password: string;
}

/** POST /v1/auth/register */
export interface RegisterDto {
  phone: string;
  password: string;
  name?: string;
  /** Обязательное согласие на обработку ПД */
  personalDataConsent: boolean;
}
