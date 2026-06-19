import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Athanasios Tasis — Engineering Observatory", short_name: "AT", start_url: "/", display: "standalone", background_color: "#0b0e0f", theme_color: "#0b0e0f" };
}
