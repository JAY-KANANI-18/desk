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
      options.extras = {
  feature: "whatsapp_embedded_signup",
  sessionInfoVersion: 2
};
      // options.redirect_uri = import.meta.env.META_REDIRECT_URI;
    }

    if (channel === "messenger") {
      options.scope = "business_management,email,pages_manage_metadata,pages_read_engagement,pages_messaging,pages_messaging_phone_number,public_profile,pages_utility_messaging";
    }

    if (channel === "instagram") {
      options.scope = 
    "instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages";
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