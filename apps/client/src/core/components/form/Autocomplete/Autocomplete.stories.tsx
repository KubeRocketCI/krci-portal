import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "@tanstack/react-form";
import { Autocomplete } from "./index";

const meta = {
  title: "Core/Components/Form/Autocomplete",
  component: Autocomplete,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Autocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

const fruits = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape", "Honeydew"];

const countries = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Japan",
  "China",
];

const programmingLanguages = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Swift",
];

export const Default: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        fruit: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="fruit">
          {(field) => (
            //@ts-expect-error TEMPORARY
            <Autocomplete field={field} label="Favorite Fruit" placeholder="Search for a fruit" options={fruits} />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithValue: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        country: "Canada",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="country">
          {(field) => (
            //@ts-expect-error TEMPORARY
            <Autocomplete field={field} label="Country" placeholder="Search for a country" options={countries} />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithTooltip: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        language: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="language">
          {(field) => (
            <Autocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Programming Language"
              placeholder="Search for a language"
              options={programmingLanguages}
              tooltipText="Select your preferred programming language"
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithHelperText: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        technology: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="technology">
          {(field) => (
            <Autocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Technology"
              placeholder="Start typing to search"
              options={programmingLanguages}
              helperText="Type at least 2 characters to see results"
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        readonly: "Apple",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="readonly">
          {(field) => (
            //@ts-expect-error TEMPORARY
            <Autocomplete field={field} label="Readonly Selection" options={fruits} disabled={true} />
          )}
        </form.Field>
      </div>
    );
  },
};

export const WithValidation: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        required: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field
          name="required"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Please select or enter a value";
              return undefined;
            },
          }}
        >
          {(field) => (
            // @ts-expect-error - can ignore this
            <Autocomplete field={field} label="Required Field" placeholder="This field is required" options={fruits} />
          )}
        </form.Field>
      </div>
    );
  },
};

export const MultipleSelection: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        languages: [],
      } as { languages: string[] },
    });

    return (
      <div className="w-[400px]">
        <form.Field name="languages">
          {(field) => (
            <Autocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Programming Languages"
              placeholder="Select multiple languages"
              options={programmingLanguages}
              multiple={true}
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const MultipleWithInitialValues: Story = {
  args: {} as Story["args"],
  render: () => {
    const form = useForm({
      defaultValues: {
        skills: ["JavaScript", "TypeScript", "React"],
      } as { skills: string[] },
    });

    return (
      <div className="w-[400px]">
        <form.Field name="skills">
          {(field) => (
            <Autocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="Your Skills"
              placeholder="Add more skills"
              options={programmingLanguages}
              multiple={true}
            />
          )}
        </form.Field>
      </div>
    );
  },
};

export const LargeDataset: Story = {
  args: {} as Story["args"],
  render: () => {
    const cities = [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose",
      "Austin",
      "Jacksonville",
      "San Francisco",
      "Columbus",
      "Indianapolis",
      "Seattle",
      "Denver",
      "Washington",
      "Boston",
      "Nashville",
      "Detroit",
      "Portland",
      "Las Vegas",
      "Memphis",
      "Louisville",
    ];

    const form = useForm({
      defaultValues: {
        city: "",
      },
    });

    return (
      <div className="w-[350px]">
        <form.Field name="city">
          {(field) => (
            <Autocomplete
              //@ts-expect-error TEMPORARY
              field={field}
              label="City"
              placeholder="Search from 25 cities"
              options={cities}
              helperText="Type to filter the list"
            />
          )}
        </form.Field>
      </div>
    );
  },
};
