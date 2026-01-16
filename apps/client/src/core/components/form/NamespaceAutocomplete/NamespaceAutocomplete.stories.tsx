import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "@tanstack/react-form";
import { NamespaceAutocomplete } from "./index";

const meta = {
  title: "Core/Components/Form/NamespaceAutocomplete",
  component: NamespaceAutocomplete,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof NamespaceAutocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

const namespaces = [
  "default",
  "kube-system",
  "kube-public",
  "kube-node-lease",
  "production",
  "staging",
  "development",
  "monitoring",
  "logging",
  "ingress-nginx",
];

export const Default: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        namespaces: [],
      } as { namespaces: string[] },
    });

    return (
      <div className="w-[400px]">
        <form.Field name="namespaces">
          {(field) => (
            <NamespaceAutocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Kubernetes Namespaces"
              placeholder="Select namespaces"
              options={namespaces}
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithSelectedNamespaces: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        namespaces: ["production", "staging"],
      } as { namespaces: string[] },
    });

    return (
      <div className="w-[400px]">
        <form.Field name="namespaces">
          {(field) => (
            <NamespaceAutocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Kubernetes Namespaces"
              placeholder="Add more namespaces"
              options={namespaces}
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const SingleNamespace: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        namespaces: ["default"],
      } as { namespaces: string[] },
    });

    return (
      <div className="w-[400px]">
        <form.Field name="namespaces">
          {(field) => (
            <NamespaceAutocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Target Namespace"
              placeholder="Select namespace"
              options={namespaces}
            />
          )}
        </form.Field>
        <p className="text-muted-foreground mt-2 text-sm">
          Currently selected: {form.state.values.namespaces.join(", ") || "None"}
        </p>
      </div>
    );
  },
};

export const ManyNamespaces: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        namespaces: ["production", "staging", "development", "monitoring"],
      } as { namespaces: string[] },
    });

    return (
      <div className="w-[400px]">
        <form.Field name="namespaces">
          {(field) => (
            <NamespaceAutocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Monitored Namespaces"
              placeholder="Add namespaces"
              options={namespaces}
            />
          )}
        </form.Field>
        <p className="text-muted-foreground mt-2 text-sm">
          Monitoring {form.state.values.namespaces.length} namespace(s)
        </p>
      </div>
    );
  },
};

export const CustomNamespaces: Story = {
  args: {} as Story["args"],
  render: () => {
    const customNamespaces = [
      "app-frontend",
      "app-backend",
      "app-database",
      "app-cache",
      "app-messaging",
      "ci-cd",
      "monitoring-prometheus",
      "monitoring-grafana",
      "logging-elasticsearch",
      "logging-kibana",
      "security-vault",
      "security-cert-manager",
    ];

    const form = useForm({
      defaultValues: {
        namespaces: [],
      } as { namespaces: string[] },
    });

    return (
      <div className="w-[400px]">
        <form.Field name="namespaces">
          {(field) => (
            <NamespaceAutocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Application Namespaces"
              placeholder="Select application namespaces"
              options={customNamespaces}
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithInteractiveCounter: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        namespaces: ["production"],
      } as { namespaces: string[] },
    });

    return (
      <div className="w-[400px] space-y-4">
        <form.Field name="namespaces">
          {(field) => (
            <NamespaceAutocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Deployment Targets"
              placeholder="Select deployment namespaces"
              options={namespaces}
            />
          )}
        </form.Field>

        <div className="bg-muted/50 rounded-md border p-4">
          <h4 className="mb-2 text-sm font-semibold">Selected Namespaces:</h4>
          {form.state.values.namespaces.length > 0 ? (
            <ul className="list-inside list-disc space-y-1">
              {form.state.values.namespaces.map((ns) => (
                <li key={ns} className="text-sm">
                  {ns}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm italic">No namespaces selected</p>
          )}
        </div>
      </div>
    );
  },
};
