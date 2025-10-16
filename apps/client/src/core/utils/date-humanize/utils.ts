import { humanize } from ".";

export const humanizeDefault = (timeA: number, timeB: number) => {
  if (!timeA || !timeB) {
    console.error("Invalid time");
    return "Invalid time";
  }

  try {
    return humanize(timeA - timeB, {
      language: "en-mini",
      spacer: "",
      delimiter: " ",
      fallbacks: ["en"],
      largest: 2,
      round: false,
      units: ["m", "s"],
    });
  } catch (e) {
    console.error(e);
    return "Error";
  }
};

export const formatFullYear = (date: Date) => {
  if (!date || !(date instanceof Date)) {
    console.error("Invalid date");
    return "Invalid date";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: "UTC",
    }).format(date);
  } catch (e) {
    console.error(e);
  }
};
