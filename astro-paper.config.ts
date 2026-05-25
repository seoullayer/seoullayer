import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://seoullayer.com/",
    title: "SeoulLayer",
    description: "Self-hosting, homelab, and smart home automation from a Korean apartment.",
    author: "SeoulLayer",
    profile: "https://seoullayer.com/about",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Asia/Seoul",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/seoullayer" },
    { name: "x",        url: "https://x.com/seoullayer" },
    { name: "mail", url: "mailto:hello@seoullayer.com" },
  ],
  shareLinks: [
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
