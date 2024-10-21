// eslint-disable-next-line import/no-unresolved
import * as github from '@actions/github';
import { chat } from 'azion/ai';

/**
 *
 */
async function runCodeReview() {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  const { context } = github;

  try {
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.payload.pull_request.number,
    });

    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.payload.pull_request.number,
    });

    let fullContent = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      if (file.status !== 'removed') {
        // eslint-disable-next-line no-await-in-loop
        const { data: content } = await octokit.rest.repos.getContent({
          owner: context.repo.owner,
          repo: context.repo.repo,
          path: file.filename,
          ref: pullRequest.head.sha,
        });

        const fileContent = Buffer.from(content.content, 'base64').toString(
          'utf-8',
        );
        fullContent += `File: ${file.filename}\n\n${fileContent}\n\n`;
      }
    }

    const prompt = `Analyze the following pull request and provide a summary of what it implements, including good practices, possible problems, and suggestions for improvement:

${fullContent}

Provide your analysis in Markdown format, starting with a general summary of the pull request.`;

    console.log(prompt);
    const { data: response, error } = await chat(
      {
        messages: [{ role: 'user', content: prompt }],
      },
      { debug: true },
    );

    if (response) {
      console.log('AI response received');

      const logoUrl =
        'https://avatars.githubusercontent.com/u/6660972?s=200&v=4';
      const logoSize = 14; // Logo size reduced to 14 pixels
      const footer = `
<div align="right">
  <span style="vertical-align: middle; font-size: 12px; line-height: ${logoSize}px;">
    Powered by 
    <img src="${logoUrl}" alt="Azion Logo" width="${logoSize}" height="${logoSize}" style="vertical-align: middle; margin: 0 2px;">
    <a href="https://github.com/aziontech/lib/tree/main/packages/ai" style="vertical-align: middle; text-decoration: none;">Azion AI</a>
  </span>
</div>`;

      const commentBody = `${response.choices[0].message.content}\n\n---\n${footer}`;

      try {
        await octokit.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.payload.pull_request.number,
          body: commentBody,
        });
        console.log('Comment successfully created on the pull request');
      } catch (commentError) {
        console.error('Error creating comment:', commentError.message);
        console.error('Error details:', JSON.stringify(commentError, null, 2));
      }
    } else {
      console.error('Code review failed:', error);
    }
  } catch (error) {
    console.error('Error during code review execution:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
}

(async () => {
  try {
    await runCodeReview();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
