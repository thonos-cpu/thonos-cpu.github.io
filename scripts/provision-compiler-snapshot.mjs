import { Sandbox } from "@vercel/sandbox";

const sandbox = await Sandbox.create({
  runtime: "node24",
  timeout: 900_000,
  networkPolicy: "allow-all",
  resources: { vcpus: 4 },
});

try {
  const setup = await sandbox.runCommand({ cmd: "bash", args: ["-lc", `
    set -euo pipefail
    dnf install -y gcc gcc-c++ java-21-amazon-corretto-devel golang rust cargo php-cli ruby lua unzip curl dotnet-sdk-8.0 swift-lang
    npm install -g typescript tsx
    curl -fsSL https://github.com/JetBrains/kotlin/releases/download/v2.2.21/kotlin-compiler-2.2.21.zip -o /tmp/kotlin.zip
    unzip -q /tmp/kotlin.zip -d /opt
    ln -sf /opt/kotlinc/bin/kotlinc /usr/local/bin/kotlinc
    for command in python3 node tsx javac gcc g++ rustc go dotnet kotlinc swift php ruby bash lua; do command -v "$command" >/dev/null; done
  `], sudo: true, timeoutMs: 840_000 });
  if (setup.exitCode !== 0) throw new Error(`${await setup.stdout()}\n${await setup.stderr()}`);
  const snapshot = await sandbox.snapshot();
  console.log(`VERCEL_SANDBOX_SNAPSHOT_ID=${snapshot.snapshotId}`);
  console.log("Add this value to Vercel Production, Preview, and Development environment variables.");
} catch (error) {
  await sandbox.stop().catch(() => undefined);
  throw error;
}
