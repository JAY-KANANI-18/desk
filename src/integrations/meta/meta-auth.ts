import { getMetaSDK } from "./meta-sdk";

export async function loginWithMeta(channel: "whatsapp" | "messenger" | "instagram") {
  const FB = await getMetaSDK();

  return new Promise((resolve, reject) => {
    const options: any = {};

    if (channel === "whatsapp") {
      options.config_id = import.meta.env.VITE_META_WHATSAPP_CONFIG_ID;
      options.response_type = "code";
      options.display = "popup";
      options.override_default_response_type = true;
      // options.redirect_uri = import.meta.env.META_REDIRECT_URI;
    }

    if (channel === "messenger") {
      options.scope = "pages_show_list,pages_manage_metadata,pages_messaging";
    }

    if (channel === "instagram") {
      options.scope = "instagram_basic,instagram_manage_messages,pages_show_list";
    }

    FB.login((response: any) => {
      if (response.authResponse) {
        resolve(response.authResponse);
      } else {
        reject(new Error("Meta login cancelled"));
      }
    }, options);
  });
}