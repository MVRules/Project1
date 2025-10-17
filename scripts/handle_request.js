import fs from "fs/promises";
import { runGenerator } from "./generator.js";
import { createAndPushRepo } from "./deploy_repo.js";
import { postEvaluationWithRetry } from "./evaluate_ping.js";

const [,, reqPath] = process.argv;
if (!reqPath) throw new Error("Usage: node handle_request.js request.json");

const main = async () => {
  const raw = await fs.readFile(reqPath, "utf8");
  const req = JSON.parse(raw);

  // Verify secret
  if (req.secret !== process.env.BUILD_SECRET) {
    throw new Error("Secret mismatch.");
  }

  console.log(`✅ Verified secret for ${req.email}, task ${req.task}`);

  // Generate app files
  const files = await runGenerator({
    brief: req.brief,
    task: req.task,
    checks: req.checks || [],
  });

  const workdir = `./build-${req.task}`;
  await fs.mkdir(workdir, { recursive: true });

  for (const [name, content] of Object.entries(files)) {
    await fs.writeFile(`${workdir}/${name}`, content, "utf8");
  }

  // Add license and README
  await fs.writeFile(`${workdir}/LICENSE`, "MIT License", "utf8");
  await fs.writeFile(
    `${workdir}/README.md`,
    `# ${req.task}\n\n${req.brief}\n\nMIT License\n`,
    "utf8"
  );

  // Deploy repo + enable Pages
  const repoInfo = await createAndPushRepo({
    workdir,
    githubToken: process.env.GITHUB_TOKEN,
    githubUser: process.env.GITHUB_USER,
    uniqueName: req.task,
  });

  // Ping evaluation API
  const evaluationPayload = {
    email: req.email,
    task: req.task,
    round: req.round,
    nonce: req.nonce,
    repo_url: repoInfo.repo_url,
    commit_sha: repoInfo.commit_sha,
    pages_url: repoInfo.pages_url,
  };

  await postEvaluationWithRetry(req.evaluation_url, evaluationPayload);
  console.log("🎉 Build and evaluation ping complete.");
};

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
