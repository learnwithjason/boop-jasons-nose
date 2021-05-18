const { App, Octokit } = require('octokit');
const {
  createOrUpdateTextFile,
} = require('@octokit/plugin-create-or-update-text-file');

const MyOctokit = Octokit.plugin(createOrUpdateTextFile).defaults({
  userAgent: 'boop-jasons-nose-app/v1.0.0',
});

const app = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY.replace(/\\n/gm, '\n'),
  webhooks: {
    secret: process.env.WEBHOOK_SECRET,
  },
  Octokit: MyOctokit,
});

function bumpBoopCounter(content) {
  return content.replace(
    /<!-- boop-counter -->(\d+)<!-- \/boop-counter -->/,
    (_content, counter) =>
      `<!-- boop-counter -->${Number(counter) + 1}<!-- /boop-counter -->`,
  );
}

async function boopJasonsNose(octokit) {
  await octokit.createOrUpdateTextFile({
    owner: 'jlengstorf',
    repo: 'jlengstorf',
    path: 'README.md',
    message: 'BOOP',
    content: ({ content }) => {
      return bumpBoopCounter(content);
    },
  });
}

app.webhooks.on('issues.opened', async ({ octokit, payload }) => {
  await boopJasonsNose(octokit);
  console.log('Nose booped by @' + payload.sender.login);
});

exports.handler = async function (event) {
  try {
    await app.webhooks.verifyAndReceive({
      id:
        event.headers['X-GitHub-Delivery'] ||
        event.headers['x-github-delivery'],
      name: event.headers['X-GitHub-Event'] || event.headers['x-github-event'],
      signature:
        event.headers['X-Hub-Signature-256'] ||
        event.headers['x-hub-signature-256'],
      payload: JSON.parse(event.body),
    });

    return {
      statusCode: 200,
      body: '{"ok":true}',
    };
  } catch (error) {
    app.log.error(error);
    return {
      statusCode: error.status || 500,
      error: 'ooops',
    };
  }
};
