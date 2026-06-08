# CDK Stacks

Stack files define durable cloud resources. Keep each construct at one abstraction level and expose only the outputs other stacks need.

Security defaults must be explicit: encryption, private networking where possible, retention policies, logging, alarms, and deletion protection choices should be deliberate.

Cost-impacting changes need clear intent in code structure and tests. Avoid adding always-on resources, broad log retention, or high-capacity defaults without a reason.

Update snapshot tests when resource output intentionally changes. If a snapshot changes unexpectedly, inspect the synthesized template before accepting it.
