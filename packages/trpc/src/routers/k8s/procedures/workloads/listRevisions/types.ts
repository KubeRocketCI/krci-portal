export interface DeploymentRevision {
  revision: number;
  replicaSetName: string;
  replicaSetUid: string;
  creationTimestamp: string;
  images: string[];
  isCurrent: boolean;
}
