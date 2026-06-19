import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://tasis.info", lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
