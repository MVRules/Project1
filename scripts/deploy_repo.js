import { execSync } from "child_process";
import fetch from "node-fetch";

export async function createAndPushRepo({ workdir, githubToken, githubUser, uniqueName }) {
  const repoName = `${uniqueName}-${Date.now()}`.toLowerCase();
  console.log("📦 Creating repo:", repoName);

  const create = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: repoName, private: false }),
  });

  const repo = await create.json();
  const repoUrl = repo.html_url;
  const pagesUrl = `https://${githubUser}.github.io/${repoName}/`;

  execSync("git init", { cwd: workdir });
  execSync('git config user.email "action@github.com"', { cwd: workdir });
  execSync('git config user.name "GitHub Action"', { cwd: workdir });
  execSync("git add .", { cwd: workdir });
  execSync('git commit -m "initial commit"', { cwd: workdir });
  execSync(`git branch -M main`, { cwd: workdir });
  execSync(
    `git remote add origin https://${githubUser}:${githubToken}@github.com/${githubUser}/${repoName}.git`,
    { cwd: workdir }
  );
  execSync("git push origin main --force", { cwd: workdir });

  const commitSha = execSync("git rev-parse HEAD", { cwd: workdir })
    .toString()
    .trim();

  // Enable Pages
  await fetch(`https://api.github.com/repos/${githubUser}/${repoName}/pages`, {
    method: "POST",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source: { branch: "main", path: "/" } }),
  });

  console.log("🌐 Pages URL:", pagesUrl);

  return { repo_url: repoUrl, commit_sha: commitSha, pages_url: pagesUrl };
}
