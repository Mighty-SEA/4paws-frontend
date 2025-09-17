import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "4Paws Pet Care",
  version: packageJson.version,
  copyright: `© ${currentYear} 4Paws Pet Care`,
  meta: {
    title: "4Paws Pet Care - Clinic Admin",
    description: "4Paws Pet Care clinic administration dashboard.",
  },
};
