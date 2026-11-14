---
name: cli-gcloud
description: Use `gcloud` (gcloud 593.0.0): gcloud - manage Google Cloud resources and developer workflow
---

# gcloud 593.0.0

Binary: `gcloud`. Declared in `tools.toml`; install or update with `ay up gcloud`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `gcloud --help`

```text
NAME
    gcloud - manage Google Cloud resources and developer workflow

SYNOPSIS
    gcloud GROUP | COMMAND [--account=ACCOUNT]
        [--billing-project=BILLING_PROJECT] [--configuration=CONFIGURATION]
        [--flags-file=YAML_FILE] [--flatten=[KEY,...]] [--format=FORMAT]
        [--help] [--project=PROJECT_ID] [--quiet, -q]
        [--verbosity=VERBOSITY; default="warning"] [--version, -v] [-h]
        [--access-token-file=ACCESS_TOKEN_FILE]
        [--impersonate-service-account=SERVICE_ACCOUNT_EMAILS] [--log-http]
        [--trace-token=TRACE_TOKEN] [--no-user-output-enabled]

DESCRIPTION
    The gcloud CLI manages authentication, local configuration, developer
    workflow, and interactions with the Google Cloud APIs.

    For a quick introduction to the gcloud CLI, a list of commonly used
    commands, and a look at how these commands are structured, run gcloud
    cheat-sheet or see the `gcloud` CLI cheat sheet
    (https://cloud.google.com/sdk/docs/cheatsheet).

GLOBAL FLAGS
     --account=ACCOUNT
        Google Cloud user account to use for invocation. Overrides the default
        core/account property value for this command invocation.

     --billing-project=BILLING_PROJECT
        The Google Cloud project that will be charged quota for operations
        performed in gcloud. You can use this flag to specify the billing
        project when you need to operate on one project, but need quota against
        a different project. If both billing/quota_project and
        --billing-project are specified, --billing-project takes precedence.
        Run $ gcloud config set --help to see more information about
        billing/quota_project.

     --configuration=CONFIGURATION
        Named configuration to use for this command invocation. To set the
        equivalent of this flag for a terminal session, you can also use the
        CLOUDSDK_ACTIVE_CONFIG_NAME environment variable. For more information
        on how to use configurations, run: gcloud topic configurations.

     --flags-file=YAML_FILE
        A YAML or JSON file that specifies a --flag:value dictionary. Useful
        for specifying complex flag values with special characters that work
        with any command interpreter. Additionally, each --flags-file arg is
        replaced by its constituent flags. See $ gcloud topic flags-file for
        more information.

     --flatten=[KEY,...]
        Flatten output resource slices in KEY into separate records for each
        item in each slice. Multiple keys and slices may be specified. This
        also flattens keys for --format and --filter. For example,
        --flatten=abc.def flattens abc.def[].ghi references to abc.def.ghi. A
        resource record containing abc.def[] with N elements will expand to N
        records in the flattened output. This allows you to specify what
        resource-key the filter will operate on. This flag interacts with other
        flags that are applied in this order: --flatten, --sort-by, --filter,
        --limit.

     --format=FORMAT
        Sets the format for printing command output resources. The default is a
        command-specific human-friendly output format. If both core/format and
        --format are specified, --format takes precedence. --format and
        core/format both take precedence over core/default_format. The
        supported formats are limited to: config, csv, default, diff, disable,
        flattened, get, json, list, multi, none, object, table, text, value,
        yaml. For more details run $ gcloud topic formats. Run $ gcloud config
        set --help to see more information about core/format.

```
