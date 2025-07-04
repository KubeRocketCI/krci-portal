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
| config | object | `{"apiPrefix":"/api","defaultClusterName":"","defaultClusterNamespace":"","deployClientDistDir":"/app/static","oidc":{"clientSecretName":"","enabled":false,"oidcClientId":"","oidcClientSecretKey":"","oidcCodeChallengeMethod":"S256","oidcIssuerUrl":"","oidcScope":"openid profile email"},"serverSecretKey":"","serverSecretName":""}` | Application configuration These values will be converted to environment variables in the deployment |
| config.apiPrefix | string | `"/api"` | API prefix for backend routes (API_PREFIX env var) |
| config.defaultClusterName | string | `""` | Key name for default cluster name in the secret |
| config.defaultClusterNamespace | string | `""` | Default namespace (DEFAULT_CLUSTER_NAMESPACE env var) |
| config.deployClientDistDir | string | `"/app/static"` | Directory where client static files are deployed (DEPLOY_CLIENT_DIST_DIR env var) |
| config.oidc | object | `{"clientSecretName":"","enabled":false,"oidcClientId":"","oidcClientSecretKey":"","oidcCodeChallengeMethod":"S256","oidcIssuerUrl":"","oidcScope":"openid profile email"}` | OIDC configuration - variables will be taken from Kubernetes secret |
| config.oidc.clientSecretName | string | `""` | Name of the Kubernetes secret containing OIDC configuration |
| config.oidc.enabled | bool | `false` | Enable OIDC authentication |
| config.oidc.oidcClientId | string | `""` | Key name for OIDC client ID in the secret |
| config.oidc.oidcClientSecretKey | string | `""` | Key name for OIDC client secret in the secret |
| config.oidc.oidcCodeChallengeMethod | string | `"S256"` | Key name for OIDC code challenge method in the secret (e.g., "S256") |
| config.oidc.oidcIssuerUrl | string | `""` | Key name for OIDC issuer URL in the secret (e.g., https://idp.example.com/realms/broker) |
| config.oidc.oidcScope | string | `"openid profile email"` | Key name for OIDC scopes in the secret (e.g., "openid profile email") |
| config.serverSecretKey | string | `""` | Key name for secret containing server secret |
| config.serverSecretName | string | `""` | Name of the Kubernetes secret containing server secret |
| externalSecrets.enabled | bool | `false` | Configure External Secrets for KubeRocketCI platform. Deploy SecretStore. Default: false |
| externalSecrets.manageKRCIPortalSecrets | bool | `true` |  |
| externalSecrets.manageKRCIPortalSecretsName | string | `"/krci/deploy-secrets"` |  |
| externalSecrets.secretProvider.aws.region | string | `"eu-central-1"` | AWS Region where secrets are stored, e.g. eu-central-1 |
| externalSecrets.secretProvider.aws.role | string | `nil` | IAM Role to be used for Accessing AWS either Parameter Store or Secret Manager. Format: arn:aws:iam::<AWS_ACCOUNT_ID>:role/<AWS_IAM_ROLE_NAME> |
| externalSecrets.secretProvider.aws.service | string | `"ParameterStore"` | Use AWS as a Secret Provider. Can be ParameterStore or SecretsManager |
| externalSecrets.secretProvider.generic.secretStore.name | string | `"example-secret-store"` | Defines SecretStore name. |
| externalSecrets.secretProvider.generic.secretStore.providerConfig | object | `{}` | Defines SecretStore provider configuration. |
| externalSecrets.type | string | `"aws"` | Defines provider type. One of `aws` or `generic`. |
| fullnameOverride | string | `""` | Override the full name of the chart |
| image | object | `{"pullPolicy":"IfNotPresent","repository":"krci-portal","tag":""}` | Image configuration |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy |
| image.repository | string | `"krci-portal"` | Image repository |
| image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion. |
| imagePullSecrets | list | `[{"name":"regcred"}]` | Image pull secrets for private registries |
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
