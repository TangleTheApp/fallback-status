const wait = require('./wait');

const core = require('@actions/core');
const { Octokit } = require("@octokit/core");

async function run() {
  try {
    const repository = process.env.GITHUB_REPOSITORY.split('/')
    const input = {
      token: core.getInput('repo-token'),
      timeout: core.getInput('timeout'),
      statusName: core.getInput('status-name'),
      githubSha: process.env.GITHUB_SHA,
      githubOwner: repository[0],
      githubRepo: repository[1],
    };

    const octokit = new Octokit({
      auth: input.token,
    });

    const startTime = new Date()

    await wait(1000);

    while (getTimeElapsed(startTime) < input.timeout) {
      response = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/status', {
        owner: input.githubOwner,
        repo: input.githubRepo,
        ref: input.githubSha,
      })
      core.info(response);
      if (response.data.state == 'success') {
        core.setOutput('should-fallback', false)
        return;
      }
      if (response.data.state == 'failure') {
        core.setOutput('should-fallback', true)
        return;
      }
      await wait(3000);
    }
    core.error('Timed out waiting for response state to exit pending...')
    core.setOutput('should-fallback', true)
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()

function getTimeElapsed(startTime) {
  const now = new Date()
  return Math.abs(now - startTime) / 1000
}