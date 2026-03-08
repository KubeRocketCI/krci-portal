import { useAuth } from "@/core/auth/provider";

export function WelcomeStepContent() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <img src="/krci-logo.svg" alt="KubeRocketCI" className="h-10 w-10" />
        <h3 className="text-base font-semibold">Welcome{firstName ? `, ${firstName}` : ""}!</h3>
      </div>
      <p>
        Let us show you around the KubeRocketCI platform. This quick tour will walk you through the key areas of the
        interface.
      </p>
    </div>
  );
}
