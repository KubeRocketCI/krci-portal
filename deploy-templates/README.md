# krci-portal

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.1.0](https://img.shields.io/badge/AppVersion-0.1.0-informational?style=flat-square)

A Helm chart for Kubernetes

**Homepage:** <https://github.com/epmd-edp/other-npm-krci-portal.git>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| DEV Team |  |  |

## Source Code

* <https://github.com/epmd-edp/other-npm-krci-portal.git>

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` | Affinity for pod assignment https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity |
| autoscaling | object | `{"enabled":false,"maxReplicas":100,"minReplicas":1,"targetCPUUtilizationPercentage":80}` | Horizontal Pod Autoscaler configuration |
| autoscaling.enabled | bool | `false` | Enable autoscaling |
| autoscaling.maxReplicas | int | `100` | Maximum number of replicas |
| autoscaling.minReplicas | int | `1` | Minimum number of replicas |
| autoscaling.targetCPUUtilizationPercentage | int | `80` | Target CPU utilization percentage |
| configEnv.API_PREFIX | string | `"/api"` |  |
| configEnv.DEFAULT_CLUSTER_NAME | string | `"core"` |  |
| configEnv.DEFAULT_CLUSTER_NAMESPACE | string | `"krci"` |  |
| configEnv.DEPENDENCY_TRACK_URL | string | `"https://deptrack.example.com"` |  |
| configEnv.DEPLOY_CLIENT_DIST_DIR | string | `"/app/static"` |  |
| configEnv.OIDC_CLIENT_ID | string | `"portal"` |  |
| configEnv.OIDC_CODE_CHALLENGE_METHOD | string | `"S256"` |  |
| configEnv.OIDC_ISSUER_URL | string | `"https://keycloak.example.com/realms/shared"` |  |
| configEnv.OIDC_SCOPE | string | `"openid profile email"` |  |
| configEnv.SERVER_PORT | int | `3000` |  |
| configEnv.SONAR_HOST_URL | string | `"https://sonar.example.com/"` |  |
| configEnv.TEKTON_RESULTS_URL | string | `"https://tekton-results.example.com"` |  |
| eso.aws | object | `{"region":"eu-central-1","roleArn":"arn:aws:iam::012345678910:role/AWSIRSA_Shared_ExternalSecretOperatorAccess"}` | AWS configuration (if provider is `aws`). |
| eso.aws.region | string | `"eu-central-1"` | AWS region. |
| eso.aws.roleArn | string | `"arn:aws:iam::012345678910:role/AWSIRSA_Shared_ExternalSecretOperatorAccess"` | AWS role ARN for the ExternalSecretOperator to assume. |
| eso.enabled | bool | `false` | Install components of the ESO. |
| eso.generic.secretStore.providerConfig | object | `{}` | Defines SecretStore provider configuration. |
| eso.provider | string | `"aws"` | Defines provider type. One of `aws`, `generic`, or `vault`. |
| eso.secretPath | string | `"/infra/core/addons/krci-portal"` | Defines the path to the secret in the provider. If provider is `vault`, this is the path must be prefixed with `secret/`. |
| eso.vault | object | `{"mountPath":"core","role":"krci-portal","server":"http://vault.vault:8200"}` | Vault configuration (if provider is `vault`). |
| eso.vault.mountPath | string | `"core"` | Mount path for the Kubernetes authentication method. |
| eso.vault.role | string | `"krci-portal"` | Vault role for the Kubernetes authentication method. |
| eso.vault.server | string | `"http://vault.vault:8200"` | Vault server URL. |
| fullnameOverride | string | `""` | Override the full name of the chart |
| image | object | `{"pullPolicy":"IfNotPresent","repository":"krci-portal","tag":""}` | Image configuration |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy |
| image.repository | string | `"krci-portal"` | Image repository |
| image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion. |
| imagePullSecrets | list | `[]` | Image pull secrets for private registries |
| ingress | object | `{"annotations":{},"className":"","dnsWildcard":"","enabled":false,"hosts":[{"host":"edpDefault","paths":[{"path":"/","pathType":"ImplementationSpecific"}]}],"tls":[]}` | Ingress configuration |
| ingress.annotations | object | `{}` | Ingress annotations |
| ingress.className | string | `""` | Ingress class name |
| ingress.dnsWildcard | string | `""` | DNS wildcard for the cluster |
| ingress.enabled | bool | `false` | Enable ingress |
| ingress.hosts | list | `[{"host":"edpDefault","paths":[{"path":"/","pathType":"ImplementationSpecific"}]}]` | Ingress hosts configuration |
| ingress.tls | list | `[]` | TLS configuration |
| livenessProbe | object | `{"tcpSocket":{"port":"http"}}` | Liveness probe configuration |
| nameOverride | string | `""` | Override the name of the chart |
| nodeSelector | object | `{}` | Node selector for pod assignment https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#nodeselector |
| podAnnotations | object | `{}` | Pod annotations |
| podLabels | object | `{}` | Pod labels |
| podSecurityContext | object | `{}` | Pod security context |
| readinessProbe | object | `{"initialDelaySeconds":20,"tcpSocket":{"port":"http"}}` | Readiness probe configuration |
| replicaCount | int | `1` | Number of replicas for the deployment |
| resources | object | `{}` | Resource limits and requests |
| securityContext | object | `{}` | Container security context |
| service | object | `{"port":3000,"type":"ClusterIP"}` | Service configuration |
| service.type | string | `"ClusterIP"` | Service type |
| serviceAccount | object | `{"annotations":{},"automount":true,"create":true,"name":""}` | Service account configuration |
| serviceAccount.annotations | object | `{}` | Annotations to add to the service account |
| serviceAccount.automount | bool | `true` | Automatically mount a ServiceAccount's API credentials? |
| serviceAccount.create | bool | `true` | Specifies whether a service account should be created |
| serviceAccount.name | string | `""` | The name of the service account to use. If not set and create is true, a name is generated using the fullname template |
| tolerations | list | `[]` | Tolerations for pod assignment https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/ |
| volumeMounts | list | `[]` | Additional volumeMounts on the output Deployment definition. |
| volumes | list | `[]` | Additional volumes on the output Deployment definition. |
