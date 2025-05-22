import { KubeObjectBase } from "@my-project/shared";

export class K8sResourceBase {
  static readonly kind: string;
  static readonly apiVersion: string;
  static readonly group: string;

  static readonly singularName: string;
  static readonly pluralName: string;

  readonly resource: KubeObjectBase = {} as KubeObjectBase;

  constructor(resource: KubeObjectBase) {
    this.resource = resource;
  }
}
