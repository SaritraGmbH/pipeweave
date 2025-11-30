import { useTranslations, useLocale } from "next-intl";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

// Import dayjs locales
import "dayjs/locale/de";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/it";

dayjs.extend(utc);
dayjs.extend(relativeTime);

/**
 * Custom hook that provides formatters with translations pre-bound
 * @returns {Object} Object containing formatter functions with translations
 */
export const useFormatters = () => {
  const t = useTranslations("FORMATTERS");
  const locale = useLocale();

  // Set dayjs locale based on the current locale
  const dayjsLocale = locale === "en" ? "en" : locale;
  dayjs.locale(dayjsLocale);

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (e.g., "USD", "EUR")
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount, currency) => {
    const userLocale = navigator.language || "en-US";

    const options = currency
      ? {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 2,
        }
      : {
          style: "decimal",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        };

    let numberFormat = new Intl.NumberFormat(userLocale, options);
    return numberFormat.format(amount);
  };

  /**
   * Format decimal number
   * @param {number} amount - Amount to format
   * @returns {string} Formatted decimal string
   */
  const formatDecimal = (amount) => {
    const userLocale = navigator.language || "en-US";

    let numberFormat = new Intl.NumberFormat([userLocale], {
      style: "decimal",
      minimumFractionDigits: 2,
    });
    return numberFormat.format(amount);
  };

  /**
   * Convert bytes to file size (legacy function name)
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted file size
   */
  const convertBytesToFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  /**
   * Format bytes to human-readable file size
   * @param {number} bytes - Number of bytes
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {string} Formatted file size
   */
  function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  /**
   * Format detailed relative time (e.g., "1 day, 2 hours, 43 minutes ago")
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted relative time
   */
  const formatDetailedRelativeTime = (dateString) => {
    const date = dayjs.utc(dateString);
    const now = dayjs();
    const diffSeconds = now.diff(date, "second");

    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor((diffSeconds % 86400) / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    const parts = [];

    if (days > 0) {
      parts.push(`${days} ${days === 1 ? t("day") : t("days")}`);
    }
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? t("hour") : t("hours")}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? t("minute") : t("minutes")}`);
    }
    // Only show seconds if less than a day
    if (days === 0 && (seconds > 0 || parts.length === 0)) {
      parts.push(`${seconds} ${seconds === 1 ? t("second") : t("seconds")}`);
    }

    const timeParts = parts.join(", ");
    return t("time_ago", { time: timeParts });
  };

  /**
   * Format timestamp based on age
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted timestamp
   */
  const formatTimestamp = (dateString) => {
    const date = dayjs.utc(dateString);
    const now = dayjs();
    const diffMinutes = now.diff(date, "minute");
    const diffHours = now.diff(date, "hour");
    const isSameYear = now.year() === date.year();

    // Less than 1 hour: show relative time (e.g., "34m ago", "1h ago")
    if (diffHours < 1) {
      if (diffMinutes < 1) return t("just_now");
      return `${diffMinutes}m ${t("ago")}`;
    } else if (diffHours < 24) {
      return `${diffHours}h ${t("ago")}`;
    }

    // Same year: show month name and day (e.g., "Feb 6")
    if (isSameYear) {
      return date.format("MMM D");
    }

    // Previous year: show numeric format (e.g., "10/3/24")
    return date.format("M/D/YY");
  };

  /**
   * Format date as relative time (e.g., "2 days ago")
   * Uses dayjs locale for translation
   * @param {string|Date} dateString - ISO date string or Date object
   * @returns {string} Formatted relative time
   */
  const formatRelativeTime = (dateString) => {
    return dayjs(dateString).fromNow();
  };

  /**
   * Format date with custom format pattern
   * Uses dayjs locale for month/day names
   * @param {string|Date} dateString - ISO date string or Date object
   * @param {string} formatPattern - dayjs format pattern (default: "MMMM D, YYYY [at] hh:mm A")
   * @returns {string} Formatted date
   */
  const formatDate = (dateString, formatPattern = "MMMM D, YYYY [at] hh:mm A") => {
    return dayjs(dateString).format(formatPattern);
  };

  return {
    formatCurrency,
    formatDecimal,
    convertBytesToFileSize,
    formatBytes,
    formatDetailedRelativeTime,
    formatTimestamp,
    formatRelativeTime,
    formatDate,
  };
};
