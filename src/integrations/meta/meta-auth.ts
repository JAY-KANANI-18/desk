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

type WhatsAppEmbeddedSession = {
  businessId?: string;
  phoneNumberId: string;
  wabaId: string;
};

function isFacebookOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "facebook.com" || hostname.endsWith(".facebook.com");
  } catch {
    return false;
  }
}

function parseEmbeddedSignupMessage(event: MessageEvent) {
  if (!isFacebookOrigin(event.origin)) {
    return null;
  }

  const payload =
    typeof event.data === "string"
      ? (() => {
          try {
            return JSON.parse(event.data);
          } catch {
            return null;
          }
        })()
      : event.data;

  if (!payload || payload.type !== "WA_EMBEDDED_SIGNUP") {
    return null;
  }

  return payload;
}

export async function loginWithWhatsAppBusinessApp(options: {
  state: string;
  configId?: string;
}): Promise<{ code: string; session: WhatsAppEmbeddedSession }> {
  if (!options.configId) {
    throw new Error("Missing WhatsApp Embedded Signup config ID.");
  }

  const FB = await getMetaSDK();

  return new Promise((resolve, reject) => {
    let authCode: string | null = null;
    let session: WhatsAppEmbeddedSession | null = null;
    let settled = false;

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("WhatsApp Business App login timed out. Please try again."));
    }, 5 * 60 * 1000);

    const cleanup = () => {
      settled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
    };

    const maybeResolve = () => {
      if (!authCode || !session || settled) {
        return;
      }

      cleanup();
      resolve({
        code: authCode,
        session,
      });
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      cleanup();
      reject(error);
    };

    const handleMessage = (event: MessageEvent) => {
      const payload = parseEmbeddedSignupMessage(event);
      if (!payload) {
        return;
      }

      if (payload.event === "CANCEL") {
        fail(new Error("WhatsApp Business App login was cancelled."));
        return;
      }

      if (payload.event === "ERROR") {
        fail(
          new Error(
            payload.data?.error_message ??
              "WhatsApp Business App login failed.",
          ),
        );
        return;
      }

      if (payload.event !== "FINISH" && payload.event !== "FINISH_ONLY_WABA") {
        return;
      }

      const phoneNumberId =
        payload.data?.phone_number_id ??
        payload.data?.phoneNumberId ??
        null;
      const wabaId = payload.data?.waba_id ?? payload.data?.wabaId ?? null;

      if (!wabaId || !phoneNumberId) {
        fail(
          new Error(
            "WhatsApp Business App signup did not return the selected phone number.",
          ),
        );
        return;
      }

      session = {
        businessId:
          payload.data?.business_id ?? payload.data?.businessId ?? undefined,
        phoneNumberId,
        wabaId,
      };

      maybeResolve();
    };

    window.addEventListener("message", handleMessage);

    FB.login(
      (response: any) => {
        if (!response?.authResponse) {
          fail(new Error("WhatsApp Business App login was cancelled."));
          return;
        }

        const code =
          response.authResponse.code ??
          response.code ??
          response.authResponse.authorizationCode ??
          null;

        if (!code) {
          fail(new Error("Meta did not return an authorization code."));
          return;
        }

        authCode = code;
        maybeResolve();
      },
      {
        config_id: options.configId,
        response_type: "code",
        override_default_response_type: true,
        state: options.state,
        extras: {
          feature: "whatsapp_embedded_signup",
          sessionInfoVersion: 2,
        },
      },
    );
  });
}
