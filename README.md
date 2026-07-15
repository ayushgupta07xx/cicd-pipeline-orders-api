# cicd-pipeline-orders-api

A second service onboarded to the shared delivery pipeline. Node/Express, port 3000,
Prometheus metrics at `/metrics`.

Onboarding required exactly two files — `Jenkinsfile` (3 lines) and `deploy-config.yaml`.
No change was made to the shared library to support this service.
