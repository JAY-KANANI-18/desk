import { loginWithMeta } from "./meta-auth";
import type { MetaChannel, MetaAuthResponse } from "./meta-types";

export async function connectMetaChannel(channel: MetaChannel): Promise<MetaAuthResponse> {
  return loginWithMeta(channel);
}