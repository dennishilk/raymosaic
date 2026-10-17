# Security and privacy

RAYMOSAIC is a static browser application. It has no user accounts or hosted backend and does not intentionally send text, drawings or generated GIFs to any service. Exports are generated locally, and sharing happens only at the user's request. The source files and example media are served by whatever host **you choose** to run; normal hosting/network behavior still applies when downloading them.

Input lengths are intentionally limited. Code changes should avoid injecting user-controlled text into HTML, remote scripts, unsafe serialization, or unnecessary requests to third-party services.

**Sensitive security findings:** please use GitHub's private vulnerability reporting feature *if enabled for this repository*. If it is unavailable, contact the maintainer privately rather than publicly disclosing an unpatched exploit. Do not include passwords, tokens or personal data in bug reports.

As an engineering prototype, the app has not received a formal third-party security audit.