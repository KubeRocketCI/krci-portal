import React from "react";
import { cn } from "@/core/utils/classname";
import { ratingDefault, ratingA, ratingB, ratingC, ratingD, ratingE } from "./styles";

export const Rating = ({ rating, hideValue }: { rating?: string; hideValue?: boolean }) => {
  const ratingProp = React.useMemo(() => {
    switch (rating) {
      case "1.0":
        return {
          name: "A",
          className: ratingA,
        };

      case "2.0":
        return {
          name: "B",
          className: ratingB,
        };

      case "3.0":
        return {
          name: "C",
          className: ratingC,
        };

      case "4.0":
        return {
          name: "D",
          className: ratingD,
        };

      case "5.0":
        return {
          name: "E",
          className: ratingE,
        };

      default:
        return {
          name: "",
          className: ratingDefault,
        };
    }
  }, [rating]);

  return (
    <div className={cn(ratingProp.className, "flex items-center justify-center rounded-full")}>
      {!hideValue && ratingProp.name}
    </div>
  );
};
