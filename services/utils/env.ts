import type { VercelRequest } from "@vercel/node";

export enum ENV {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
}

const getCurrentEnv = () => {
  const currentUrl = window.location.href;

  if (
    currentUrl.includes("localhost") ||
    currentUrl.includes("192.168.139.173")
  ) {
    return ENV.DEVELOPMENT;
  }
  if (currentUrl.includes("misoauto-misodope-misodope-s-team.vercel.app")) {
    return ENV.STAGING;
  }
  if (currentUrl.includes("misoauto.vercel.app")) {
    return ENV.PRODUCTION;
  }
};

export const getCurrentRequestEnv = (req: VercelRequest) => {
  const currentUrl = req.headers.host;
  console.log("CURRENT URL", currentUrl);
  if (currentUrl?.includes("localhost") || currentUrl?.includes("127.0.0.1")) {
    return ENV.DEVELOPMENT;
  }
  if (currentUrl?.includes("misoauto-misodope-misodope-s-team.vercel.app")) {
    return ENV.STAGING;
  }
  if (currentUrl?.includes("misoauto.vercel.app")) {
    return ENV.PRODUCTION;
  }
};

export const getRedirectUrl = (env: ENV) => {
  switch (env) {
    case ENV.DEVELOPMENT:
      return "https://192.168.139.173:5173/api/auth/redirect";
    case ENV.PRODUCTION:
      return "https://misoauto.vercel.app/api/auth/redirect";
    case ENV.STAGING:
      return "https://misoauto-misodope-misodope-s-team.vercel.app/api/auth/redirect";
  }
};

export const getAuthUrl = () => {
  switch (getCurrentEnv()) {
    case ENV.DEVELOPMENT:
      return "http://192.168.139.173:5173/api/auth/tiktok";
    case ENV.PRODUCTION:
      return "https://misoauto.vercel.app/api/auth/tiktok";
    case ENV.STAGING:
      return "https://misoauto-misodope-misodope-s-team.vercel.app/api/auth/tiktok";
  }
};

export const getApiUrl = () => {
  switch (getCurrentEnv()) {
    case ENV.DEVELOPMENT:
      return "http://192.168.139.173:5173/api";
    case ENV.PRODUCTION:
      return "https://misoauto.vercel.app/api";
    case ENV.STAGING:
      return "https://misoauto-misodope-misodope-s-team.vercel.app/api";
  }
};
