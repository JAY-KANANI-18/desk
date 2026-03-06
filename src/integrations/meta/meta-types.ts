export type MetaChannel = "whatsapp" | "messenger" | "instagram";

export interface MetaAuthResponse {
  accessToken: string;
  userID: string;
  expiresIn?: number;
  signedRequest?: string;
}

export interface MetaLoginResponse {
  authResponse?: MetaAuthResponse;
  status: string;
}

export interface MetaSDK {
  init: (config: any) => void;
  login: (
    callback: (response: MetaLoginResponse) => void,
    options: Record<string, any>
  ) => void;
}