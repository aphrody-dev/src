---
name: cli-ovhcloud
description: Use `ovhcloud` (ovhcloud 0.16.0): CLI to manage your OVHcloud services
---

# ovhcloud 0.16.0

Binary: `ovhcloud`. Declared in `tools.toml`; install or update with `ay up ovhcloud`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `account`, `alldom`, `baremetal`, `browser`, `cdn-dedicated`, `cloud`, `completion`, `config`, `dedicated-ceph`, `dedicated-cloud`, `dedicated-cluster`, `dedicated-nasha`, `domain-name`, `domain-zone`, `email-domain`, `email-mxplan`, `email-pro`, `hosting-private-database`, `iam`, `ip`, `iploadbalancing`, `ldp`, `location`, `login`. Details: `ovhcloud <subcommand> --help`.

## `ovhcloud --help`

```text
CLI to manage your OVHcloud services

Usage:
  ovhcloud [command]

Available Commands:
  account                          Manage your account
  alldom                           Retrieve information and manage your AllDom services
  baremetal                        Retrieve information and manage your Bare Metal services
  browser                          Launch a TUI for the OVHcloud Manager - Public Cloud universe only [EXPE...
  cdn-dedicated                    Retrieve information and manage your dedicated CDN services
  cloud                            Manage your projects and services in the Public Cloud universe (MKS, MPR...
  completion                       Generate shell completion scripts
  config                           Manage your CLI configuration
  dedicated-ceph                   Retrieve information and manage your Dedicated Ceph services
  dedicated-cloud                  Retrieve information and manage your DedicatedCloud services
  dedicated-cluster                Retrieve information and manage your DedicatedCluster services
  dedicated-nasha                  Retrieve information and manage your Dedicated NasHA services
  domain-name                      Retrieve information and manage your domain names
  domain-zone                      Retrieve information and manage your domain zones
  email-domain                     Retrieve information and manage your Email Domain services
  email-mxplan                     Retrieve information and manage your Email MXPlan services
  email-pro                        Retrieve information and manage your EmailPro services
  help                             Help about any command
  hosting-private-database         Retrieve information and manage your HostingPrivateDatabase services
  iam                              Manage IAM resources, permissions and policies
  ip                               Retrieve information and manage your IP services
  iploadbalancing                  Retrieve information and manage your IP LoadBalancing services
  ldp                              Retrieve information and manage your LDP (Logs Data Platform) services
  location                         Retrieve information and manage your Location services
  login                            Login to your OVHcloud account to create API credentials
  logout                           Revoke your API credentials and remove them from the configuration
  nutanix                          Retrieve information and manage your Nutanix services
  okms                             Retrieve information and manage your OKMS (Key Management Services)
  overthebox                       Retrieve information and manage your OverTheBox services
  ovhcloudconnect                  Retrieve information and manage your OVHcloud Connect services
  pack-xdsl                        Retrieve information and manage your PackXDSL services
  sms                              Retrieve information and manage your SMS services
  ssl                              Retrieve information and manage your SSL services
  ssl-gateway                      Retrieve information and manage your SSL Gateway services
  storage-netapp                   Retrieve information and manage your Storage NetApp services
  support-tickets                  Retrieve information and manage your support tickets
  telephony                        Retrieve information and manage your Telephony services
  upgrade                          Upgrade OVHcloud CLI to the latest version
  veeamcloudconnect                Retrieve information and manage your VeeamCloudConnect services
  veeamenterprise                  Retrieve information and manage your VeeamEnterprise services
  version                          Get OVHcloud CLI version
  vmwareclouddirector-backup       Retrieve information and manage your VMware Cloud Director Backup services
  vmwareclouddirector-organization Retrieve information and manage your VMware Cloud Director Organizations
  vps                              Retrieve information and manage your VPS services
  vrack                            Retrieve information and manage your vRack services
  vrackservices                    Retrieve information and manage your vRackServices services
  webhosting                       Retrieve information and manage your WebHosting services
  xdsl                             Retrieve information and manage your XDSL services

Flags:
  -d, --debug            Activate debug mode (will log all HTTP requests details)
  -h, --help             help for ovhcloud
  -e, --ignore-errors    Ignore errors in API calls when it is not fatal to the execution
  -o, --output string    Output format: json, yaml, interactive, or a custom format expression (using https...
                         Examples:
                           --output json
                           --output yaml
                           --output interactive
                           --output 'id' (to extract a single field)
                           --output 'nested.field.subfield' (to extract a nested field)
                           --output '[id, "name"]' (to extract multiple fields as an array)
                           --output '{"newKey": oldKey, "otherKey": nested.field}' (to extract and rename f...
                           --output 'name+","+type' (to extract and concatenate fields in a string)
                           --output '(nbFieldA + nbFieldB) * 10' (to compute values from numeric fields)
```
