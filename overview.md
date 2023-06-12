# PR Reviewer with Azure OpenAI GPT Task for Azure Pipelines

The Task is designed to use the Azure OpenAI or OpenAI GPT 3.5 model to review code changes and provide feedback as comments in the PR Process.

## Setup

Before using this task, ensure that the build service has permissions to contribute to Pull Requests in your repository, and allow the task to access the system token.

### Give permission to the build service agent

In order for Pipeline to have the permission to add PR Comments, you must set Pipeline (Build Services) to have the following permissions in the permission settings of the repo:  
![contribute_to_pr](https://arock.blob.core.windows.net/blogdata202304/PR-Permission.gif)


### Allow Task to access the system token 

Depending on the type of pipeline you are using, follow one of the two steps below:

#### Yaml pipelines 

Add a checkout section with persistCredentials set to true.

```yaml
steps:
- checkout: self
  persistCredentials: true
```

#### Classic editors 

Enable the option "Allow scripts to access the OAuth token" in the "Agent job" properties.

![圖片](https://arock.blob.core.windows.net/blogdata202304/AllowScript.gif)

## How to use it

### Install the extension

To use the GPT Pull Request Review Task, first install the extension in your Azure DevOps organization. Click on the "Get it free" button and follow the prompts to install it. You may need to authorize the extension to access your Azure DevOps account.

### Add the task to the build pipeline

After installing the extension, add the task to your build pipeline. Go to your build pipeline, click on the "+" icon to add a new task, and search for "Review PR by GPT". Select it and add it to your pipeline.

### Configure the task

Once you have added the task to your pipeline, configure it. In the task configuration, provide your API key from OpenAI API or Azure OpenAI API. 

To create an OpenAI API key, go to https://platform.openai.com/account/api-keys.
To create an Azure OpenAI API key, you have to create Azure OpenAI Services from https://portal.azure.com/#create/Microsoft.CognitiveServicesOpenAI. 

If you choose to use the Azure Open AI service, you must fill in the endpoint and API key of Azure OpenAI. The format of the endpoint is as follows:
https://{XXXXXXXX}.openai.azure.com/openai/deployments/{YourModelName}/chat/completions?api-version=2023-03-15-preview

After you created an Azure OpenAI service in the Azure Portal, yoy have to deploy the gpt-35-turbo model. This task currently uses the gpt-35-turbo model to operate. Please record your deployment model name and update it in the above endpoint.

### Review Pull Requests

When the build is triggered from a Pull Request, the task will review it. If there is feedback on the changed code, the task will add comments to the Pull Request. If the build is triggered manually, the task will be skipped.

## Compatible with Linux Build Agents

The tasks can execute on all supported build agent operating systems **including Linux and MacOS**.

## Referenced Original Project

This project refers to the project whose original license is MIT, and adds Azure Open AI, Multi-Language support.

Original Project:    
https://github.com/mlarhrouch/azure-pipeline-gpt-pr-review