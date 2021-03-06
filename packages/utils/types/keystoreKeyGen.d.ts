/// <reference path="keystores.d.ts" />

declare module '@endpass/utils/keystoreKeyGen' {
  export function getPublicKey(password: string, v3Keystore: V3Keystore): string;
  export function getPrivateKey(password: string, v3Keystore: V3Keystore): string;
}
