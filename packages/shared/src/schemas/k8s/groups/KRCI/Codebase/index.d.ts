import { z } from "zod";
declare const codebaseSpecSchema: z.ZodObject<{
    type: z.ZodString;
    branchToCopyInDefaultBranch: z.ZodOptional<z.ZodString>;
    buildTool: z.ZodString;
    ciTool: z.ZodDefault<z.ZodString>;
    commitMessagePattern: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    defaultBranch: z.ZodString;
    deploymentScript: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    disablePutDeployTemplates: z.ZodOptional<z.ZodBoolean>;
    emptyProject: z.ZodBoolean;
    framework: z.ZodString;
    gitServer: z.ZodString;
    gitUrlPath: z.ZodString;
    jiraIssueMetadataPayload: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    jiraServer: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lang: z.ZodString;
    private: z.ZodDefault<z.ZodBoolean>;
    repository: z.ZodObject<{
        url: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string | null;
    }, {
        url: string | null;
    }>;
    strategy: z.ZodEnum<["create", "clone", "import"]>;
    testReportFramework: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ticketNamePattern: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    versioning: z.ZodObject<{
        type: z.ZodString;
        startFrom: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        startFrom?: string | null | undefined;
    }, {
        type: string;
        startFrom?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: string;
    buildTool: string;
    ciTool: string;
    defaultBranch: string;
    deploymentScript: string;
    emptyProject: boolean;
    framework: string;
    gitServer: string;
    gitUrlPath: string;
    lang: string;
    private: boolean;
    repository: {
        url: string | null;
    };
    strategy: "create" | "clone" | "import";
    versioning: {
        type: string;
        startFrom?: string | null | undefined;
    };
    branchToCopyInDefaultBranch?: string | undefined;
    commitMessagePattern?: string | null | undefined;
    description?: string | null | undefined;
    disablePutDeployTemplates?: boolean | undefined;
    jiraIssueMetadataPayload?: string | null | undefined;
    jiraServer?: string | null | undefined;
    testReportFramework?: string | null | undefined;
    ticketNamePattern?: string | null | undefined;
}, {
    type: string;
    buildTool: string;
    defaultBranch: string;
    emptyProject: boolean;
    framework: string;
    gitServer: string;
    gitUrlPath: string;
    lang: string;
    repository: {
        url: string | null;
    };
    strategy: "create" | "clone" | "import";
    versioning: {
        type: string;
        startFrom?: string | null | undefined;
    };
    branchToCopyInDefaultBranch?: string | undefined;
    ciTool?: string | undefined;
    commitMessagePattern?: string | null | undefined;
    deploymentScript?: string | undefined;
    description?: string | null | undefined;
    disablePutDeployTemplates?: boolean | undefined;
    jiraIssueMetadataPayload?: string | null | undefined;
    jiraServer?: string | null | undefined;
    private?: boolean | undefined;
    testReportFramework?: string | null | undefined;
    ticketNamePattern?: string | null | undefined;
}>;
type CodebaseSpec = z.infer<typeof codebaseSpecSchema>;
declare const codebaseStatusSchema: z.ZodObject<{
    username: z.ZodString;
    value: z.ZodString;
    status: z.ZodString;
    action: z.ZodString;
    available: z.ZodBoolean;
    detailedMessage: z.ZodOptional<z.ZodString>;
    failureCount: z.ZodNumber;
    git: z.ZodString;
    gitWebUrl: z.ZodOptional<z.ZodString>;
    lastTimeUpdated: z.ZodString;
    result: z.ZodEnum<["success", "error"]>;
    webHookID: z.ZodOptional<z.ZodNumber>;
    webHookRef: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username: string;
    value: string;
    status: string;
    action: string;
    available: boolean;
    failureCount: number;
    git: string;
    lastTimeUpdated: string;
    result: "success" | "error";
    detailedMessage?: string | undefined;
    gitWebUrl?: string | undefined;
    webHookID?: number | undefined;
    webHookRef?: string | undefined;
}, {
    username: string;
    value: string;
    status: string;
    action: string;
    available: boolean;
    failureCount: number;
    git: string;
    lastTimeUpdated: string;
    result: "success" | "error";
    detailedMessage?: string | undefined;
    gitWebUrl?: string | undefined;
    webHookID?: number | undefined;
    webHookRef?: string | undefined;
}>;
type CodebaseStatus = z.infer<typeof codebaseStatusSchema>;
declare const codebaseSchema: z.ZodObject<{
    apiVersion: z.ZodString;
    kind: z.ZodString;
    metadata: z.ZodObject<{
        annotations: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        creationTimestamp: z.ZodString;
        deletionGracePeriodSeconds: z.ZodOptional<z.ZodNumber>;
        deletionTimestamp: z.ZodOptional<z.ZodString>;
        finalizers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        generateName: z.ZodOptional<z.ZodString>;
        generation: z.ZodOptional<z.ZodNumber>;
        labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        managedFields: z.ZodOptional<z.ZodArray<z.ZodObject<{
            apiVersion: z.ZodString;
            fieldsType: z.ZodString;
            fieldsV1: z.ZodString;
            manager: z.ZodString;
            operation: z.ZodString;
            subresource: z.ZodString;
            timestamp: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            apiVersion: string;
            fieldsType: string;
            fieldsV1: string;
            manager: string;
            operation: string;
            subresource: string;
            timestamp: string;
        }, {
            apiVersion: string;
            fieldsType: string;
            fieldsV1: string;
            manager: string;
            operation: string;
            subresource: string;
            timestamp: string;
        }>, "many">>;
        name: z.ZodString;
        namespace: z.ZodOptional<z.ZodString>;
        ownerReferences: z.ZodOptional<z.ZodArray<z.ZodObject<{
            apiVersion: z.ZodString;
            blockOwnerDeletion: z.ZodBoolean;
            controller: z.ZodBoolean;
            kind: z.ZodString;
            name: z.ZodString;
            uid: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            apiVersion: string;
            blockOwnerDeletion: boolean;
            controller: boolean;
            kind: string;
            name: string;
            uid: string;
        }, {
            apiVersion: string;
            blockOwnerDeletion: boolean;
            controller: boolean;
            kind: string;
            name: string;
            uid: string;
        }>, "many">>;
        resourceVersion: z.ZodOptional<z.ZodString>;
        selfLink: z.ZodOptional<z.ZodString>;
        uid: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        uid: string;
        creationTimestamp: string;
        annotations?: Record<string, string> | undefined;
        deletionGracePeriodSeconds?: number | undefined;
        finalizers?: string[] | undefined;
        generateName?: string | undefined;
        generation?: number | undefined;
        labels?: Record<string, string> | undefined;
        namespace?: string | undefined;
        ownerReferences?: {
            apiVersion: string;
            blockOwnerDeletion: boolean;
            controller: boolean;
            kind: string;
            name: string;
            uid: string;
        }[] | undefined;
        deletionTimestamp?: string | undefined;
        managedFields?: {
            apiVersion: string;
            fieldsType: string;
            fieldsV1: string;
            manager: string;
            operation: string;
            subresource: string;
            timestamp: string;
        }[] | undefined;
        resourceVersion?: string | undefined;
        selfLink?: string | undefined;
    }, {
        name: string;
        uid: string;
        creationTimestamp: string;
        annotations?: Record<string, string> | undefined;
        deletionGracePeriodSeconds?: number | undefined;
        finalizers?: string[] | undefined;
        generateName?: string | undefined;
        generation?: number | undefined;
        labels?: Record<string, string> | undefined;
        namespace?: string | undefined;
        ownerReferences?: {
            apiVersion: string;
            blockOwnerDeletion: boolean;
            controller: boolean;
            kind: string;
            name: string;
            uid: string;
        }[] | undefined;
        deletionTimestamp?: string | undefined;
        managedFields?: {
            apiVersion: string;
            fieldsType: string;
            fieldsV1: string;
            manager: string;
            operation: string;
            subresource: string;
            timestamp: string;
        }[] | undefined;
        resourceVersion?: string | undefined;
        selfLink?: string | undefined;
    }>;
    spec: z.ZodObject<{
        type: z.ZodString;
        branchToCopyInDefaultBranch: z.ZodOptional<z.ZodString>;
        buildTool: z.ZodString;
        ciTool: z.ZodDefault<z.ZodString>;
        commitMessagePattern: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultBranch: z.ZodString;
        deploymentScript: z.ZodDefault<z.ZodString>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        disablePutDeployTemplates: z.ZodOptional<z.ZodBoolean>;
        emptyProject: z.ZodBoolean;
        framework: z.ZodString;
        gitServer: z.ZodString;
        gitUrlPath: z.ZodString;
        jiraIssueMetadataPayload: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        jiraServer: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        lang: z.ZodString;
        private: z.ZodDefault<z.ZodBoolean>;
        repository: z.ZodObject<{
            url: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string | null;
        }, {
            url: string | null;
        }>;
        strategy: z.ZodEnum<["create", "clone", "import"]>;
        testReportFramework: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ticketNamePattern: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        versioning: z.ZodObject<{
            type: z.ZodString;
            startFrom: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            startFrom?: string | null | undefined;
        }, {
            type: string;
            startFrom?: string | null | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        buildTool: string;
        ciTool: string;
        defaultBranch: string;
        deploymentScript: string;
        emptyProject: boolean;
        framework: string;
        gitServer: string;
        gitUrlPath: string;
        lang: string;
        private: boolean;
        repository: {
            url: string | null;
        };
        strategy: "create" | "clone" | "import";
        versioning: {
            type: string;
            startFrom?: string | null | undefined;
        };
        branchToCopyInDefaultBranch?: string | undefined;
        commitMessagePattern?: string | null | undefined;
        description?: string | null | undefined;
        disablePutDeployTemplates?: boolean | undefined;
        jiraIssueMetadataPayload?: string | null | undefined;
        jiraServer?: string | null | undefined;
        testReportFramework?: string | null | undefined;
        ticketNamePattern?: string | null | undefined;
    }, {
        type: string;
        buildTool: string;
        defaultBranch: string;
        emptyProject: boolean;
        framework: string;
        gitServer: string;
        gitUrlPath: string;
        lang: string;
        repository: {
            url: string | null;
        };
        strategy: "create" | "clone" | "import";
        versioning: {
            type: string;
            startFrom?: string | null | undefined;
        };
        branchToCopyInDefaultBranch?: string | undefined;
        ciTool?: string | undefined;
        commitMessagePattern?: string | null | undefined;
        deploymentScript?: string | undefined;
        description?: string | null | undefined;
        disablePutDeployTemplates?: boolean | undefined;
        jiraIssueMetadataPayload?: string | null | undefined;
        jiraServer?: string | null | undefined;
        private?: boolean | undefined;
        testReportFramework?: string | null | undefined;
        ticketNamePattern?: string | null | undefined;
    }>;
    status: z.ZodObject<{
        username: z.ZodString;
        value: z.ZodString;
        status: z.ZodString;
        action: z.ZodString;
        available: z.ZodBoolean;
        detailedMessage: z.ZodOptional<z.ZodString>;
        failureCount: z.ZodNumber;
        git: z.ZodString;
        gitWebUrl: z.ZodOptional<z.ZodString>;
        lastTimeUpdated: z.ZodString;
        result: z.ZodEnum<["success", "error"]>;
        webHookID: z.ZodOptional<z.ZodNumber>;
        webHookRef: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        value: string;
        status: string;
        action: string;
        available: boolean;
        failureCount: number;
        git: string;
        lastTimeUpdated: string;
        result: "success" | "error";
        detailedMessage?: string | undefined;
        gitWebUrl?: string | undefined;
        webHookID?: number | undefined;
        webHookRef?: string | undefined;
    }, {
        username: string;
        value: string;
        status: string;
        action: string;
        available: boolean;
        failureCount: number;
        git: string;
        lastTimeUpdated: string;
        result: "success" | "error";
        detailedMessage?: string | undefined;
        gitWebUrl?: string | undefined;
        webHookID?: number | undefined;
        webHookRef?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    status: {
        username: string;
        value: string;
        status: string;
        action: string;
        available: boolean;
        failureCount: number;
        git: string;
        lastTimeUpdated: string;
        result: "success" | "error";
        detailedMessage?: string | undefined;
        gitWebUrl?: string | undefined;
        webHookID?: number | undefined;
        webHookRef?: string | undefined;
    };
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        uid: string;
        creationTimestamp: string;
        annotations?: Record<string, string> | undefined;
        deletionGracePeriodSeconds?: number | undefined;
        finalizers?: string[] | undefined;
        generateName?: string | undefined;
        generation?: number | undefined;
        labels?: Record<string, string> | undefined;
        namespace?: string | undefined;
        ownerReferences?: {
            apiVersion: string;
            blockOwnerDeletion: boolean;
            controller: boolean;
            kind: string;
            name: string;
            uid: string;
        }[] | undefined;
        deletionTimestamp?: string | undefined;
        managedFields?: {
            apiVersion: string;
            fieldsType: string;
            fieldsV1: string;
            manager: string;
            operation: string;
            subresource: string;
            timestamp: string;
        }[] | undefined;
        resourceVersion?: string | undefined;
        selfLink?: string | undefined;
    };
    spec: {
        type: string;
        buildTool: string;
        ciTool: string;
        defaultBranch: string;
        deploymentScript: string;
        emptyProject: boolean;
        framework: string;
        gitServer: string;
        gitUrlPath: string;
        lang: string;
        private: boolean;
        repository: {
            url: string | null;
        };
        strategy: "create" | "clone" | "import";
        versioning: {
            type: string;
            startFrom?: string | null | undefined;
        };
        branchToCopyInDefaultBranch?: string | undefined;
        commitMessagePattern?: string | null | undefined;
        description?: string | null | undefined;
        disablePutDeployTemplates?: boolean | undefined;
        jiraIssueMetadataPayload?: string | null | undefined;
        jiraServer?: string | null | undefined;
        testReportFramework?: string | null | undefined;
        ticketNamePattern?: string | null | undefined;
    };
}, {
    status: {
        username: string;
        value: string;
        status: string;
        action: string;
        available: boolean;
        failureCount: number;
        git: string;
        lastTimeUpdated: string;
        result: "success" | "error";
        detailedMessage?: string | undefined;
        gitWebUrl?: string | undefined;
        webHookID?: number | undefined;
        webHookRef?: string | undefined;
    };
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        uid: string;
        creationTimestamp: string;
        annotations?: Record<string, string> | undefined;
        deletionGracePeriodSeconds?: number | undefined;
        finalizers?: string[] | undefined;
        generateName?: string | undefined;
        generation?: number | undefined;
        labels?: Record<string, string> | undefined;
        namespace?: string | undefined;
        ownerReferences?: {
            apiVersion: string;
            blockOwnerDeletion: boolean;
            controller: boolean;
            kind: string;
            name: string;
            uid: string;
        }[] | undefined;
        deletionTimestamp?: string | undefined;
        managedFields?: {
            apiVersion: string;
            fieldsType: string;
            fieldsV1: string;
            manager: string;
            operation: string;
            subresource: string;
            timestamp: string;
        }[] | undefined;
        resourceVersion?: string | undefined;
        selfLink?: string | undefined;
    };
    spec: {
        type: string;
        buildTool: string;
        defaultBranch: string;
        emptyProject: boolean;
        framework: string;
        gitServer: string;
        gitUrlPath: string;
        lang: string;
        repository: {
            url: string | null;
        };
        strategy: "create" | "clone" | "import";
        versioning: {
            type: string;
            startFrom?: string | null | undefined;
        };
        branchToCopyInDefaultBranch?: string | undefined;
        ciTool?: string | undefined;
        commitMessagePattern?: string | null | undefined;
        deploymentScript?: string | undefined;
        description?: string | null | undefined;
        disablePutDeployTemplates?: boolean | undefined;
        jiraIssueMetadataPayload?: string | null | undefined;
        jiraServer?: string | null | undefined;
        private?: boolean | undefined;
        testReportFramework?: string | null | undefined;
        ticketNamePattern?: string | null | undefined;
    };
}>;
type Codebase = z.infer<typeof codebaseSchema>;
export { codebaseSchema, codebaseSpecSchema, codebaseStatusSchema, type Codebase, type CodebaseSpec, type CodebaseStatus, };
