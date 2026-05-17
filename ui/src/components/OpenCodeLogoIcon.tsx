import { cn } from "../lib/utils";

import { useTranslation } from "react-i18next";
interface OpenCodeLogoIconProps {
  className?: string;
}

export function OpenCodeLogoIcon({ className }: OpenCodeLogoIconProps) {
  const { t } = useTranslation("common");
  return (
    <>
      <img
        src="/brands/opencode-logo-light-square.svg"
        alt="OpenCode"
        className={cn("dark:hidden", className)}
      />
      <img
        src="/brands/opencode-logo-dark-square.svg"
        alt="OpenCode"
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}
