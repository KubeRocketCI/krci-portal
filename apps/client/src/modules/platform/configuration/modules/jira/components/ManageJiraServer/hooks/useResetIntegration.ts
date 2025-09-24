import { JiraServer, Secret } from "@my-project/shared";
import { useJiraServerCRUD } from "@/k8s/api/groups/KRCI/JiraServer";
import { useSecretCRUD } from "@/k8s/api/groups/Core/Secret";

export const useResetIntegration = () => {
  const {
    triggerDeleteJiraServer,
    mutations: { jiraServerDeleteMutation },
  } = useJiraServerCRUD();

  const {
    triggerDeleteSecret,
    mutations: { secretDeleteMutation },
  } = useSecretCRUD();

  const isLoading = jiraServerDeleteMutation.isPending || secretDeleteMutation.isPending;

  const resetJiraIntegration = async ({
    jiraServer,
    jiraServerSecret,
  }: {
    jiraServer: JiraServer | undefined;
    jiraServerSecret: Secret | undefined;
  }) => {
    if (!jiraServer) {
      return;
    }

    await triggerDeleteJiraServer({
      data: { resource: jiraServer },
      callbacks: {
        onSuccess: async () => {
          if (!jiraServerSecret) {
            return;
          }
          await triggerDeleteSecret({ data: { resource: jiraServerSecret } });
        },
      },
    });
  };

  return { resetJiraIntegration, isLoading };
};
