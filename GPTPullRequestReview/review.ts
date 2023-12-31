import tl = require('azure-pipelines-task-lib/task');
import fetch = require('node-fetch');
import simpleGit = require('simple-git');
import binaryExtensions = require('binary-extensions');


const gitOptions: Partial<simpleGit.SimpleGitOptions> = {
  baseDir: `${tl.getVariable('System.DefaultWorkingDirectory')}`,
  binary: 'git'
};

let completionUri = "https://api.openai.com/v1/chat/completions";
let git: simpleGit.SimpleGit;
let apiKey: string | undefined;
let api_key_source: string | undefined;
let aoai_endpoint: string | undefined;
let targetBranch: string;
let completionUriAuthType="Authorization";
let comment_language="English";

async function run() {
  try {
    if (tl.getVariable('Build.Reason') !== 'PullRequest') {
      tl.setResult(tl.TaskResult.Skipped, "This task should be run only when the build is triggered from a Pull Request.");
      return;
    }

    apiKey = tl.getInput('api_key', true);
    api_key_source = tl.getInput('api_key_source', true);
    aoai_endpoint = tl.getInput('aoai_endpoint', false);   
    comment_language = tl.getInput('comment_language', true);   

    if (apiKey == undefined) {
      tl.setResult(tl.TaskResult.Failed, 'No Api Key provided!');
      return;
    }
    if (api_key_source == undefined) {
      tl.setResult(tl.TaskResult.Failed, 'must select Api Key source!');
      return;
    }
    if (api_key_source=="azureopenai")
    {
      if (aoai_endpoint == undefined) {
        tl.setResult(tl.TaskResult.Failed, 'No azure OpenAI endpoint provided!');
        return;
      }
      completionUri=aoai_endpoint;
      completionUriAuthType="api-key";
    }
    else
    {
      apiKey='Bearer ' + apiKey; 
    }
    //comment language
    if(comment_language=="en-US") comment_language="English";
    if(comment_language=="zh-TW") comment_language="Chinese traditional";
    if(comment_language=="zh-CN") comment_language="Chinese Simplified";
    if(comment_language=="ko-KR") comment_language="Korean";
    if(comment_language=="ja-JP") comment_language="japanese";

    git = simpleGit.simpleGit(gitOptions);
    targetBranch = `origin/${tl.getVariable('System.PullRequest.TargetBranchName')}`;

    const filesNames = await GetChangedFiles(targetBranch);

    await DeleteExistingComments();

    filesNames.forEach(async fileName => {
      await reviewFile(fileName)
    });

    tl.setResult(tl.TaskResult.Succeeded, "Pull Request reviewed.");
  }
  catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

async function GetChangedFiles(targetBranch: string) {
  await git.addConfig('core.pager', 'cat');
  await git.addConfig('core.quotepath', 'false');
  await git.fetch();

  const diffs = await git.diff([targetBranch, '--name-only']);
  const files = diffs.split('\n').filter(line => line.trim().length > 0);
  const nonBinaryfiles = files.filter(file => !binaryExtensions.includes(getFileExtension(file)));

  console.log(`Changed Files (excluding binary files) : \n ${nonBinaryfiles.join('\n')}`);

  return nonBinaryfiles;
}

async function reviewFile(fileName: string) {
  console.log(`Start reviewing ${fileName} with ${api_key_source} ...`);

  const patch = await git.diff([targetBranch, fileName]);

  const prompt = `
          Act as a code reviewer of a Pull Request, providing feedback on the code changes below.
          You are provided with the Pull Request changes in a patch format.
          Each patch entry has the commit message in the Subject line followed by the code changes (diffs) in a unidiff format.
          
          As a code reviewer, your task is:
          - Review only added, edited or deleted lines.
          - Non changed code should not be reviewed
          - If there's no bugs, write 'No feedback'.
          - Use bullet points if you have multiple comments.
          - Write your comments in ${comment_language}.
          
          Patch of the Pull Request to review:
          ${patch}
          `;

  const body = {
    model: "gpt-3.5-turbo",
    temperature: 0.3,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  }

  const response = await fetch.default(completionUri, {
    method: 'POST',
    headers: { [completionUriAuthType]: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const gptFeedback = await response.json() as any;

  if(!response.ok)
  {
    console.log("api_key_source: "+api_key_source);
    console.log("endpoint: "+completionUri);
    console.log("AuthType: "+completionUriAuthType);
    console.log("json result: %j",gptFeedback);
  }

  const choices = gptFeedback.choices
  
  if (choices && choices.length > 0) {
    const review = choices[0].message.content as string

    if (!review.includes("No feedback.")) {
      await AddCommentToPR(fileName, review);
    }
  }

  console.log(`Review of ${fileName} completed.`);
}

async function AddCommentToPR(fileName: string, comment: string) {
  const body = {
    comments: [
      {
        parentCommentId: 0,
        content: comment,
        commentType: 1
      }
    ],
    status: 1,
    threadContext: {
      filePath: fileName,
    }
  }

  const prUrl = `${tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')}${tl.getVariable('SYSTEM.TEAMPROJECTID')}/_apis/git/repositories/${tl.getVariable('Build.Repository.Name')}/pullRequests/${tl.getVariable('System.PullRequest.PullRequestId')}/threads?api-version=5.1`

  await fetch.default(prUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tl.getVariable('SYSTEM.ACCESSTOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  console.log(`New comment added.`);
}

async function DeleteExistingComments() {
  console.log("Start deleting existing comments added by the previous Job ...");

  const threadsUrl = `${tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')}${tl.getVariable('SYSTEM.TEAMPROJECTID')}/_apis/git/repositories/${tl.getVariable('Build.Repository.Name')}/pullRequests/${tl.getVariable('System.PullRequest.PullRequestId')}/threads?api-version=5.1`;
  const threadsResponse = await fetch.default(threadsUrl, {
    headers: { Authorization: `Bearer ${tl.getVariable('SYSTEM.ACCESSTOKEN')}` },
  });

  const threads = await threadsResponse.json() as { value: [] };
  const threadsWithContext = threads.value.filter((thread: any) => thread.threadContext !== null);

  const collectionUri = tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI') as string;
  const collectionName = getCollectionName(collectionUri);
  const buildServiceName = `${tl.getVariable('SYSTEM.TEAMPROJECT')} Build Service (${collectionName})`;

  for (const thread of threadsWithContext as any[]) {
    const commentsUrl = `${tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')}${tl.getVariable('SYSTEM.TEAMPROJECTID')}/_apis/git/repositories/${tl.getVariable('Build.Repository.Name')}/pullRequests/${tl.getVariable('System.PullRequest.PullRequestId')}/threads/${thread.id}/comments?api-version=5.1`;
    const commentsResponse = await fetch.default(commentsUrl, {
      headers: { Authorization: `Bearer ${tl.getVariable('SYSTEM.ACCESSTOKEN')}` },
    });

    const comments = await commentsResponse.json() as { value: [] };

    for (const comment of comments.value.filter((comment: any) => comment.author.displayName === buildServiceName) as any[]) {
      const removeCommentUrl = `${tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')}${tl.getVariable('SYSTEM.TEAMPROJECTID')}/_apis/git/repositories/${tl.getVariable('Build.Repository.Name')}/pullRequests/${tl.getVariable('System.PullRequest.PullRequestId')}/threads/${thread.id}/comments/${comment.id}?api-version=5.1`;

      await fetch.default(removeCommentUrl, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tl.getVariable('SYSTEM.ACCESSTOKEN')}` },
      });
    }
  }

  console.log("Existing comments deleted.");
}

function getCollectionName(collectionUri: string) {
  const collectionUriWithoutProtocol = collectionUri!.replace('https://', '').replace('http://', '');

  if (collectionUriWithoutProtocol.includes('.visualstudio.')) {
    return collectionUriWithoutProtocol.split('.visualstudio.')[0];
  }
  else {
    return collectionUriWithoutProtocol.split('/')[1];
  }
}

function getFileExtension(fileName: string) {
  return fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);
}

run();