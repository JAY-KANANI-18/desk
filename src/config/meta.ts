export const META_CONFIG = {
  appId: import.meta.env.VITE_META_APP_ID,

  configs: {
    whatsapp: import.meta.env.VITE_META_WHATSAPP_CONFIG_ID,
    messenger: import.meta.env.VITE_META_MESSENGER_CONFIG_ID,
    instagram: import.meta.env.VITE_META_INSTAGRAM_CONFIG_ID
  },

  version: "v19.0"
};