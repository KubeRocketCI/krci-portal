import { cn } from "@/core/utils/classname";

const commonCardRatingClasses = "h-[21px] w-[21px] text-white text-[13px]";

export const ratingDefault = cn(commonCardRatingClasses, "bg-[#E6E6F0]");
export const ratingA = cn(commonCardRatingClasses, "bg-[#18BE94]");
export const ratingB = cn(commonCardRatingClasses, "bg-[#8CDFC9]"); // lighten("#18BE94", 0.5) ≈ #8CDFC9
export const ratingC = cn(commonCardRatingClasses, "bg-[#FFC754]");
export const ratingD = cn(commonCardRatingClasses, "bg-[#FF8832]");
export const ratingE = cn(commonCardRatingClasses, "bg-[#FD4C4D]");
