import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const required = [
  ["VITE_SUPABASE_URL", process.env.VITE_SUPABASE_URL],
  ["VITE_SUPABASE_ANON_KEY", process.env.VITE_SUPABASE_ANON_KEY],
  ["VITE_HOTEL_API_URL", process.env.VITE_HOTEL_API_URL],
];

for (const [name, value] of required) {
  if (!value) throw new Error(`Missing ${name}`);
}

const assetsDirectory = join(process.cwd(), "dist-github", "assets");
const javascript = readdirSync(assetsDirectory)
  .filter((file) => file.endsWith(".js"))
  .map((file) => readFileSync(join(assetsDirectory, file), "utf8"))
  .join("\n");

for (const [name, value] of required) {
  if (!javascript.includes(value)) {
    throw new Error(`${name} was present during the build but was not injected into the GitHub Pages bundle`);
  }
}

console.log("GitHub Pages frontend configuration was injected successfully.");
