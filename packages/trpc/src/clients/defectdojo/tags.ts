/** Test tags the krci-security-operator writes for runtime scans. */
export const CLUSTER_TAG_PREFIX = "k8s-cluster:";
export const NAMESPACE_TAG_PREFIX = "k8s-namespace:";
const WORKLOAD_TAG_PREFIX = "k8s-workload:";
export const IMAGE_TAG_PREFIX = "oci-image:";

/** Prefix of the key of the tag that copies a Namespace label: `k8s-ns-label.<label key>:<value>`. */
export const NAMESPACE_LABEL_TAG_PREFIX = "k8s-ns-label.";

const DOCKER_HUB_HOSTS = ["docker.io", "index.docker.io", "registry-1.docker.io"];
const DOCKER_HUB_LIBRARY = "library/";

/** Mirrors TagSafe of the krci-security-operator: trimmed, lower case, whitespace, commas and quotes replaced by `-`. */
export function tagSafe(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[,'"\s]/gu, "-");
}

/**
 * Lower-case registry host and repository of an image reference, without tag and digest.
 * Docker Hub is written without its host and without `library/`, so `docker.io/library/nginx:1.27`
 * and `nginx` are the same image. Mirrors NormalizeImage of the krci-security-operator.
 */
export function normalizeImage(reference: string): string {
  const [withoutDigest] = reference.split("@", 1);

  // A colon before the last slash belongs to the registry port.
  const tagSeparator = withoutDigest.indexOf(":", withoutDigest.lastIndexOf("/") + 1);
  const withoutTag = (tagSeparator === -1 ? withoutDigest : withoutDigest.slice(0, tagSeparator)).toLowerCase();

  for (const host of DOCKER_HUB_HOSTS) {
    if (withoutTag.startsWith(`${host}/`)) {
      const repository = withoutTag.slice(host.length + 1);
      return repository.startsWith(DOCKER_HUB_LIBRARY) ? repository.slice(DOCKER_HUB_LIBRARY.length) : repository;
    }
  }

  return withoutTag;
}

export function clusterTag(cluster: string): string {
  return `${CLUSTER_TAG_PREFIX}${tagSafe(cluster)}`;
}

export function namespaceTag(namespace: string): string {
  return `${NAMESPACE_TAG_PREFIX}${tagSafe(namespace)}`;
}

export function namespaceLabelTag(labelKey: string, value: string): string {
  return `${NAMESPACE_LABEL_TAG_PREFIX}${tagSafe(labelKey)}:${tagSafe(value)}`;
}

/**
 * The tag `oci-image:<normalized image>` of an image reference; undefined when the reference names no image.
 * An image whose tag value the operator shortened (over 255 characters) is not matched.
 */
export function ociImageTag(reference: string): string | undefined {
  const value = tagSafe(normalizeImage(reference));
  return value ? `${IMAGE_TAG_PREFIX}${value}` : undefined;
}

export function imageTagOf(tags: readonly string[]): string | undefined {
  return tags.find((tag) => tag.startsWith(IMAGE_TAG_PREFIX));
}

/** `<kind>/<name>` of the workloads named by the tags of a test. */
export function workloadsOf(tags: readonly string[]): string[] {
  return tags
    .filter((tag) => tag.startsWith(WORKLOAD_TAG_PREFIX))
    .map((tag) => tag.slice(WORKLOAD_TAG_PREFIX.length).replace(".", "/"));
}
