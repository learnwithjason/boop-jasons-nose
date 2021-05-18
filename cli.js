#!/usr/bin/env node

const { Octokit } = require('octokit');
const {
  createOrUpdateTextFile,
} = require('@octokit/plugin-create-or-update-text-file');
const { createOAuthDeviceAuth } = require('@octokit/auth-oauth-device');

// https://github.com/octokit/auth-oauth-device.js#readme

const MyOctokit = Octokit.plugin(createOrUpdateTextFile).defaults({
  userAgent: 'Nose Booper',
});

const octokit = new MyOctokit({
  authStrategy: createOAuthDeviceAuth,
  auth: {
    clientType: 'oauth-app',
    clientId: 'a496e67070cc4638f78a',
    scopes: ['public_repo'],
    onVerification(verification) {
      // verification example
      // {
      //   device_code: "3584d83530557fdd1f46af8289938c8ef79f9dc5",
      //   user_code: "WDJB-MJHT",
      //   verification_uri: "https://github.com/login/device",
      //   expires_in: 900,
      //   interval: 5,
      // };

      console.log('Open %s', verification.verification_uri);
      console.log('Enter code: %s', verification.user_code);
    },
  },
  // auth: process.env.GITHUB_TOKEN,
});

async function run() {
  const { data: user } = await octokit.request('GET /user');

  console.log(`authenticated as ${user.login}`);

  // get the README
  try {
    await octokit.createOrUpdateTextFile({
      owner: 'jlengstorf',
      repo: 'jlengstorf',
      path: 'README.md',
      message: 'BOOP',
      content: ({ content }) => {
        return bumpBoopCounter(content);
      },
    });

    console.log(`you done been booped`);
  } catch (error) {
    const { data: issue } = await octokit
      .request('POST /repos/{owner}/{repo}/issues', {
        owner: 'jlengstorf',
        repo: 'jlengstorf',
        title: 'plz to boop',
        body: 'I bestow upon you my finest of boops',
      })
      .catch((err) => {
        console.log(err);
      });

    console.log(`issue created at ${issue.html_url}`);
  }

  // this is the long way
  // const { data: readme } = await octokit.request(
  //   'GET /repos/{owner}/{repo}/contents/{path}',
  //   {
  //     owner: 'jlengstorf',
  //     repo: 'jlengstorf',
  //     path: 'README.md',
  //   },
  // );

  // const content = Buffer.from(readme.content, 'base64').toString();

  // const updated = bumpBoopCounter(content);

  // console.log(updated);

  // const response = await octokit.request(
  //   'PUT /repos/{owner}/{repo}/contents/{path}',
  //   {
  //     owner: 'jlengstorf',
  //     repo: 'jlengstorf',
  //     path: 'README.md',
  //     message: 'BOOP',
  //     content: Buffer.from(updated, 'utf8').toString('base64'),
  //     sha: readme.sha,
  //   },
  // );

  // console.dir(response.data);
  // https://github.com/octokit/plugin-create-or-update-text-file.js/#readme
}

run();

function bumpBoopCounter(content) {
  return content.replace(
    /<!-- boop-counter -->(\d+)<!-- \/boop-counter -->/,
    (_content, counter) =>
      `<!-- boop-counter -->${Number(counter) + 1}<!-- /boop-counter -->`,
  );
}
