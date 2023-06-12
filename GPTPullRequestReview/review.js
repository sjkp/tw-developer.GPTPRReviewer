"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var tl = require("azure-pipelines-task-lib/task");
var fetch = require("node-fetch");
var simpleGit = require("simple-git");
var binaryExtensions = require("binary-extensions");
var gitOptions = {
    baseDir: "".concat(tl.getVariable('System.DefaultWorkingDirectory')),
    binary: 'git'
};
var completionUri = "https://api.openai.com/v1/chat/completions";
var git;
var apiKey;
var api_key_source;
var aoai_endpoint;
var targetBranch;
var completionUriAuthType = "Authorization";
var comment_language = "English";
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var filesNames, err_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (tl.getVariable('Build.Reason') !== 'PullRequest') {
                        tl.setResult(tl.TaskResult.Skipped, "This task should be run only when the build is triggered from a Pull Request.");
                        return [2 /*return*/];
                    }
                    apiKey = tl.getInput('api_key', true);
                    api_key_source = tl.getInput('api_key_source', true);
                    aoai_endpoint = tl.getInput('aoai_endpoint', false);
                    comment_language = tl.getInput('comment_language', true);
                    if (apiKey == undefined) {
                        tl.setResult(tl.TaskResult.Failed, 'No Api Key provided!');
                        return [2 /*return*/];
                    }
                    if (api_key_source == undefined) {
                        tl.setResult(tl.TaskResult.Failed, 'must select Api Key source!');
                        return [2 /*return*/];
                    }
                    if (api_key_source == "azureopenai") {
                        if (aoai_endpoint == undefined) {
                            tl.setResult(tl.TaskResult.Failed, 'No azure OpenAI endpoint provided!');
                            return [2 /*return*/];
                        }
                        completionUri = aoai_endpoint;
                        completionUriAuthType = "api-key";
                    }
                    else {
                        apiKey = 'Bearer ' + apiKey;
                    }
                    //comment language
                    if (comment_language == "en-US")
                        comment_language = "English";
                    if (comment_language == "zh-TW")
                        comment_language = "Chinese traditional";
                    if (comment_language == "zh-CN")
                        comment_language = "Chinese Simplified";
                    if (comment_language == "ko-KR")
                        comment_language = "Korean";
                    if (comment_language == "ja-JP")
                        comment_language = "japanese";
                    git = simpleGit.simpleGit(gitOptions);
                    targetBranch = "origin/".concat(tl.getVariable('System.PullRequest.TargetBranchName'));
                    return [4 /*yield*/, GetChangedFiles(targetBranch)];
                case 1:
                    filesNames = _a.sent();
                    return [4 /*yield*/, DeleteExistingComments()];
                case 2:
                    _a.sent();
                    filesNames.forEach(function (fileName) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, reviewFile(fileName)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    tl.setResult(tl.TaskResult.Succeeded, "Pull Request reviewed.");
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    tl.setResult(tl.TaskResult.Failed, err_1.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function GetChangedFiles(targetBranch) {
    return __awaiter(this, void 0, void 0, function () {
        var diffs, files, nonBinaryfiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, git.addConfig('core.pager', 'cat')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, git.addConfig('core.quotepath', 'false')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, git.fetch()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, git.diff([targetBranch, '--name-only'])];
                case 4:
                    diffs = _a.sent();
                    files = diffs.split('\n').filter(function (line) { return line.trim().length > 0; });
                    nonBinaryfiles = files.filter(function (file) { return !binaryExtensions.includes(getFileExtension(file)); });
                    console.log("Changed Files (excluding binary files) : \n ".concat(nonBinaryfiles.join('\n')));
                    return [2 /*return*/, nonBinaryfiles];
            }
        });
    });
}
function reviewFile(fileName) {
    return __awaiter(this, void 0, void 0, function () {
        var patch, prompt, body, response, gptFeedback, choices, review;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Start reviewing ".concat(fileName, " with ").concat(api_key_source, " ..."));
                    return [4 /*yield*/, git.diff([targetBranch, fileName])];
                case 1:
                    patch = _b.sent();
                    prompt = "\n          Act as a code reviewer of a Pull Request, providing feedback on the code changes below.\n          You are provided with the Pull Request changes in a patch format.\n          Each patch entry has the commit message in the Subject line followed by the code changes (diffs) in a unidiff format.\n          \n          As a code reviewer, your task is:\n          - Review only added, edited or deleted lines.\n          - Non changed code should not be reviewed\n          - If there's no bugs, write 'No feedback'.\n          - Use bullet points if you have multiple comments.\n          - Write your comments in ".concat(comment_language, ".\n          \n          Patch of the Pull Request to review:\n          ").concat(patch, "\n          ");
                    body = {
                        model: "gpt-3.5-turbo",
                        temperature: 0.3,
                        max_tokens: 2000,
                        messages: [
                            {
                                role: "user",
                                content: prompt
                            }
                        ]
                    };
                    return [4 /*yield*/, fetch.default(completionUri, {
                            method: 'POST',
                            headers: (_a = {}, _a[completionUriAuthType] = apiKey, _a['Content-Type'] = 'application/json', _a),
                            body: JSON.stringify(body)
                        })];
                case 2:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    gptFeedback = _b.sent();
                    if (!response.ok) {
                        console.log("api_key_source: " + api_key_source);
                        console.log("endpoint: " + completionUri);
                        console.log("AuthType: " + completionUriAuthType);
                        console.log("json result: %j", gptFeedback);
                    }
                    choices = gptFeedback.choices;
                    if (!(choices && choices.length > 0)) return [3 /*break*/, 5];
                    review = choices[0].message.content;
                    if (!!review.includes("No feedback.")) return [3 /*break*/, 5];
                    return [4 /*yield*/, AddCommentToPR(fileName, review)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    console.log("Review of ".concat(fileName, " completed."));
                    return [2 /*return*/];
            }
        });
    });
}
function AddCommentToPR(fileName, comment) {
    return __awaiter(this, void 0, void 0, function () {
        var body, prUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = {
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
                    };
                    prUrl = "".concat(tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')).concat(tl.getVariable('SYSTEM.TEAMPROJECTID'), "/_apis/git/repositories/").concat(tl.getVariable('Build.Repository.Name'), "/pullRequests/").concat(tl.getVariable('System.PullRequest.PullRequestId'), "/threads?api-version=5.1");
                    return [4 /*yield*/, fetch.default(prUrl, {
                            method: 'POST',
                            headers: { 'Authorization': "Bearer ".concat(tl.getVariable('SYSTEM.ACCESSTOKEN')), 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                        })];
                case 1:
                    _a.sent();
                    console.log("New comment added.");
                    return [2 /*return*/];
            }
        });
    });
}
function DeleteExistingComments() {
    return __awaiter(this, void 0, void 0, function () {
        var threadsUrl, threadsResponse, threads, threadsWithContext, collectionUri, collectionName, buildServiceName, _i, _a, thread, commentsUrl, commentsResponse, comments, _b, _c, comment, removeCommentUrl;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("Start deleting existing comments added by the previous Job ...");
                    threadsUrl = "".concat(tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')).concat(tl.getVariable('SYSTEM.TEAMPROJECTID'), "/_apis/git/repositories/").concat(tl.getVariable('Build.Repository.Name'), "/pullRequests/").concat(tl.getVariable('System.PullRequest.PullRequestId'), "/threads?api-version=5.1");
                    return [4 /*yield*/, fetch.default(threadsUrl, {
                            headers: { Authorization: "Bearer ".concat(tl.getVariable('SYSTEM.ACCESSTOKEN')) },
                        })];
                case 1:
                    threadsResponse = _d.sent();
                    return [4 /*yield*/, threadsResponse.json()];
                case 2:
                    threads = _d.sent();
                    threadsWithContext = threads.value.filter(function (thread) { return thread.threadContext !== null; });
                    collectionUri = tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI');
                    collectionName = getCollectionName(collectionUri);
                    buildServiceName = "".concat(tl.getVariable('SYSTEM.TEAMPROJECT'), " Build Service (").concat(collectionName, ")");
                    _i = 0, _a = threadsWithContext;
                    _d.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 10];
                    thread = _a[_i];
                    commentsUrl = "".concat(tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')).concat(tl.getVariable('SYSTEM.TEAMPROJECTID'), "/_apis/git/repositories/").concat(tl.getVariable('Build.Repository.Name'), "/pullRequests/").concat(tl.getVariable('System.PullRequest.PullRequestId'), "/threads/").concat(thread.id, "/comments?api-version=5.1");
                    return [4 /*yield*/, fetch.default(commentsUrl, {
                            headers: { Authorization: "Bearer ".concat(tl.getVariable('SYSTEM.ACCESSTOKEN')) },
                        })];
                case 4:
                    commentsResponse = _d.sent();
                    return [4 /*yield*/, commentsResponse.json()];
                case 5:
                    comments = _d.sent();
                    _b = 0, _c = comments.value.filter(function (comment) { return comment.author.displayName === buildServiceName; });
                    _d.label = 6;
                case 6:
                    if (!(_b < _c.length)) return [3 /*break*/, 9];
                    comment = _c[_b];
                    removeCommentUrl = "".concat(tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')).concat(tl.getVariable('SYSTEM.TEAMPROJECTID'), "/_apis/git/repositories/").concat(tl.getVariable('Build.Repository.Name'), "/pullRequests/").concat(tl.getVariable('System.PullRequest.PullRequestId'), "/threads/").concat(thread.id, "/comments/").concat(comment.id, "?api-version=5.1");
                    return [4 /*yield*/, fetch.default(removeCommentUrl, {
                            method: 'DELETE',
                            headers: { Authorization: "Bearer ".concat(tl.getVariable('SYSTEM.ACCESSTOKEN')) },
                        })];
                case 7:
                    _d.sent();
                    _d.label = 8;
                case 8:
                    _b++;
                    return [3 /*break*/, 6];
                case 9:
                    _i++;
                    return [3 /*break*/, 3];
                case 10:
                    console.log("Existing comments deleted.");
                    return [2 /*return*/];
            }
        });
    });
}
function getCollectionName(collectionUri) {
    var collectionUriWithoutProtocol = collectionUri.replace('https://', '').replace('http://', '');
    if (collectionUriWithoutProtocol.includes('.visualstudio.')) {
        return collectionUriWithoutProtocol.split('.visualstudio.')[0];
    }
    else {
        return collectionUriWithoutProtocol.split('/')[1];
    }
}
function getFileExtension(fileName) {
    return fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);
}
run();
