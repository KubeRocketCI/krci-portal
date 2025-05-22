import { z } from "zod";
export declare const kubeManagedFieldsEntrySchema: z.ZodObject<{
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
}>;
export type KubeManagedFieldsEntry = z.infer<typeof kubeManagedFieldsEntrySchema>;
export declare const kubeCreationMetadataSchema: z.ZodObject<{
    annotations: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    deletionGracePeriodSeconds: z.ZodOptional<z.ZodNumber>;
    finalizers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    generateName: z.ZodOptional<z.ZodString>;
    generation: z.ZodOptional<z.ZodNumber>;
    labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
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
}, "strip", z.ZodTypeAny, {
    name: string;
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
}, {
    name: string;
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
}>;
export type KubeCreationMetadata = z.infer<typeof kubeCreationMetadataSchema>;
export declare const kubeObjectCreationSchema: z.ZodObject<{
    apiVersion: z.ZodString;
    kind: z.ZodString;
    metadata: z.ZodObject<{
        annotations: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        deletionGracePeriodSeconds: z.ZodOptional<z.ZodNumber>;
        finalizers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        generateName: z.ZodOptional<z.ZodString>;
        generation: z.ZodOptional<z.ZodNumber>;
        labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
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
    }, "strip", z.ZodTypeAny, {
        name: string;
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
    }, {
        name: string;
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
    }>;
}, "strip", z.ZodTypeAny, {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
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
    };
}, {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
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
    };
}>;
export type KubeObjectCreation = z.infer<typeof kubeObjectCreationSchema>;
export declare const kubeMetadataSchema: z.ZodObject<{
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
export type KubeMetadata = z.infer<typeof kubeMetadataSchema>;
export declare const kubeObjectBaseSchema: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
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
}, {
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
}>;
export type KubeObjectBase = z.infer<typeof kubeObjectBaseSchema>;
declare const KubeObjectListBaseSchema: z.ZodObject<{
    apiVersion: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
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
    }, "strip", z.ZodTypeAny, {
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
    }, {
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
    }>, "many">;
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
}, "strip", z.ZodTypeAny, {
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
    items: {
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
    }[];
}, {
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
    items: {
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
    }[];
}>;
export type KubeObjectListBase<T extends KubeObjectBase> = z.infer<typeof KubeObjectListBaseSchema> & {
    items: T[];
};
export declare const defaultPermissionsToCheck: readonly ["create", "update", "delete"];
export type PermissionsResult = Record<(typeof defaultPermissionsToCheck)[number], {
    allowed: boolean;
    reason: string;
}>;
export declare const defaultPermissions: {
    create: {
        allowed: boolean;
        reason: string;
    };
    update: {
        allowed: boolean;
        reason: string;
    };
    delete: {
        allowed: boolean;
        reason: string;
    };
};
export {};
