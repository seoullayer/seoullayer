import Giscus, { type Theme } from "@giscus/react";
import { useEffect, useState } from "react";

export default function Comments() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    setTheme(storedTheme || systemTheme);

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      setTheme(current === "dark" ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Giscus
      repo="seoullayer/seoullayer"
      repoId="R_kgDOSfAHdQ"
      category="Announcements"
      categoryId="DIC_kwDOSfAHdc4C9yRa"
      mapping="pathname"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme={theme}
      lang="en"
      loading="lazy"
    />
  );
}