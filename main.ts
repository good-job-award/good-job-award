function main() {
    const githubMessage = getGithubRanking();
    const backlogMessage = getBacklogRanking();
    postChatwork(githubMessage + '\n\n' + backlogMessage);
}