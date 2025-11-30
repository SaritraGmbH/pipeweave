"use client";
import * as React from "react";
import { LuCookie as Cookie } from "react-icons/lu";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/components/lib/utils";
import { useStore } from "@/store";

const CookieConsent = React.forwardRef((
  {
    variant = "default",
    demo = false,
    onAcceptCallback = () => {},
    onDeclineCallback = () => {},
    className,
    learnMoreHref = "/legal/privacy-policy",
    ...props
  },
  ref,
) => {
  const t = useTranslations("COOKIE_CONSENT");
  const [isOpen, setIsOpen] = React.useState(false);
  const [hide, setHide] = React.useState(false);

  // Zustand store state and actions
  const consentInitialized = useStore((state) => state.consent_initialized);
  const acceptAllConsent = useStore((state) => state.acceptAllConsent);
  const rejectAllConsent = useStore((state) => state.rejectAllConsent);
  const setConsentInitialized = useStore((state) => state.setConsentInitialized);

  const handleAccept = React.useCallback(() => {
    setIsOpen(false);
    document.cookie =
      "cookieConsent=true; expires=Fri, 31 Dec 9999 23:59:59 GMT";

    // Update Zustand store
    acceptAllConsent();

    setTimeout(() => {
      setHide(true);
    }, 700);
    onAcceptCallback();
  }, [onAcceptCallback, acceptAllConsent]);

  const handleDecline = React.useCallback(() => {
    setIsOpen(false);
    document.cookie =
      "cookieConsent=declined; expires=Fri, 31 Dec 9999 23:59:59 GMT";

    // Update Zustand store - functional cookies remain true
    rejectAllConsent();

    setTimeout(() => {
      setHide(true);
    }, 700);
    onDeclineCallback();
  }, [onDeclineCallback, rejectAllConsent]);

  React.useEffect(() => {
    try {
      // If consent already initialized in Zustand store, hide immediately
      if (consentInitialized && !demo) {
        setIsOpen(false);
        setHide(true);
        return;
      }

      setIsOpen(true);
      if ((document.cookie.includes("cookieConsent=true") ||
           document.cookie.includes("cookieConsent=declined")) && !demo) {
        setIsOpen(false);
        setConsentInitialized(true);
        setTimeout(() => {
          setHide(true);
        }, 700);
      }
    } catch (error) {
      console.warn("Cookie consent error:", error);
    }
  }, [demo, consentInitialized, setConsentInitialized]);

  if (hide) return null;

  const containerClasses = cn(
    "fixed z-50 transition-all duration-700",
    !isOpen ? "translate-y-full opacity-0" : "translate-y-0 opacity-100",
    className
  );

  const commonWrapperProps = {
    ref,
    className: cn(
      containerClasses,
      variant === "mini"
        ? "left-0 right-0 sm:left-4 bottom-4 w-full sm:max-w-3xl"
        : "bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 w-full sm:max-w-md"
    ),
    ...props,
  };

  // Get description based on variant
  const description = variant === "mini"
    ? t("description_short")
    : t("description");

  if (variant === "default") {
    return (
      <div {...commonWrapperProps}>
        <Card className="m-3 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">{t("title")}</CardTitle>
            <Cookie className="h-5 w-5" />
          </CardHeader>
          <CardContent className="space-y-2">
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
            <p className="text-xs text-muted-foreground">
              {t("accept_text")} <span className="font-medium">&quot;{t("accept_text_bold")}&quot;</span>{t("accept_text_after")}
            </p>
            <a
              href={learnMoreHref}
              className="text-xs text-primary underline underline-offset-4 hover:no-underline">
              {t("learn_more")}
            </a>
          </CardContent>
          <CardFooter className="flex gap-2 pt-2">
            <Button onClick={handleDecline} variant="secondary" className="flex-1">
              {t("decline_button")}
            </Button>
            <Button onClick={handleAccept} className="flex-1">
              {t("accept_button")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (variant === "small") {
    return (
      <div {...commonWrapperProps}>
        <Card className="m-3 shadow-lg">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2 h-0 px-4">
            <CardTitle className="text-base">{t("title")}</CardTitle>
            <Cookie className="h-4 w-4" />
          </CardHeader>
          <CardContent className="pt-0 pb-2 px-4">
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          </CardContent>
          <CardFooter className="flex gap-2 h-0 py-2 px-4">
            <Button
              onClick={handleDecline}
              variant="secondary"
              size="sm"
              className="flex-1 rounded-full">
              {t("decline_button")}
            </Button>
            <Button onClick={handleAccept} size="sm" className="flex-1 rounded-full">
              {t("accept_button")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (variant === "mini") {
    return (
      <div {...commonWrapperProps}>
        <Card className="mx-3 p-0 py-3 shadow-lg">
          <CardContent className="sm:flex grid gap-4 p-0 px-3.5">
            <CardDescription className="text-xs sm:text-sm flex-1">
              {description}
            </CardDescription>
            <div className="flex items-center gap-2 justify-end sm:gap-3">
              <Button
                onClick={handleDecline}
                size="sm"
                variant="secondary"
                className="text-xs h-7">
                {t("decline_button")}
                <span className="sr-only sm:hidden">{t("decline_button")}</span>
              </Button>
              <Button onClick={handleAccept} size="sm" className="text-xs h-7">
                {t("accept_button")}
                <span className="sr-only sm:hidden">{t("accept_button")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
});

CookieConsent.displayName = "CookieConsent";
export { CookieConsent };
export default CookieConsent;
