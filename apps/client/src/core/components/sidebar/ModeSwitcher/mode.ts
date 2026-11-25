import { Rocket } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import FactoryIcon from "@/assets/icons/common/factory.svg?react";
import KubernetesIcon from "@/assets/icons/k8s/kubernetes.svg?react";

export type Mode = "krci" | "k8s" | "factory";

/** The modes with their own path segment after `/c/<clusterName>/`. KRCI is every other path. */
export const MODE_SEGMENTS = ["k8s", "factory"] as const satisfies readonly Mode[];

export type ModeSegment = (typeof MODE_SEGMENTS)[number];

export interface ModeOption {
  value: Mode;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Extra classes for the icon (e.g. `fill-current` for filled SVGs that need to follow text color). */
  iconClassName?: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: "krci", label: "KRCI", icon: Rocket },
  // KubernetesIcon is a filled SVG with no `fill` attribute, so `fill-current` makes it follow the text color.
  { value: "k8s", label: "Kubernetes", icon: KubernetesIcon, iconClassName: "fill-current" },
  { value: "factory", label: "Factory", icon: FactoryIcon },
];

export function modeFromPath(pathname: string, clusterName: string | undefined): Mode {
  if (!clusterName) return "krci";
  const [, root, cluster, segment] = pathname.split("/");
  if (root !== "c" || cluster !== clusterName) return "krci";
  return MODE_SEGMENTS.find((modeSegment) => modeSegment === segment) ?? "krci";
}
