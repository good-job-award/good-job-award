// GitHubのPersonal Access Tokne
const githubToken: string = userProperties.getProperty('GITHUB_TOKEN') || '';

function getGithubRanking(): string {
    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    const options = {
        'method' : 'get',
        'headers' : headers
    };

    const map = new Map<string, number>();

    // PRを集計する
    correctPr(options, map);

    // Issueを集計する
    correctIssue(options, map);

    // 集計値出力
    const sortedRanking = Array.from(map.entries()).sort((r1, r2) => r2[1] - r1[1]);
    const rankingStrings: string[] = [];
    const rankSize = sortedRanking.length < RANKING_SIZE ? sortedRanking.length: RANKING_SIZE;
    rankingStrings.push('GitHub更新ランキング');
    for (let i = 0; i < rankSize; i++) if (i < sortedRanking.length) {
        rankingStrings.push(`${i + 1}位: ${sortedRanking[i][0]} ${sortedRanking[i][1]}pt`);
    }
    return rankingStrings.join('\n');
}

function correctPr(options, map: Map<string, number>) {
    // PRの一覧取得
  // TODO: 対象のリポジトリをいい感じに編集できるようにする
  const response = UrlFetchApp.fetch('https://api.github.com/repos/kotanin/TestActions/pulls?state=all', options);
    const json = response.getContentText();
    const data = JSON.parse(json);

    const today = Date.now()
    data.forEach(pr => {
      // 7日以内のPRを対象に集計する
      const diffDays = (today - Date.parse(pr['updated_at'])) / 86400000;
      if (diffDays <= 7) {
        // PRを立てた人を集計する
        const userName:string = pr['user']['login'];
        const count = map.get(userName) || 0;
        map.set(userName, count + 1);

        // 7日以内にコメントした人を集計する
        const commentResponse = UrlFetchApp.fetch(pr['comments_url'], options);
        const commentJson = commentResponse.getContentText();
        const commentData = JSON.parse(commentJson);
        commentData.forEach(comment => {
          if ((today - Date.parse(comment['updated_at'])) / 86400000 <= 7) {
            const commentUserName = comment['user']['login'];
            const commentCount = map.get(commentUserName) || 0;
            map.set(commentUserName, commentCount + 1);
          }
        });
      }
    });
}

function correctIssue(options, map: Map<string, number>) {
  // Issueの一覧取得
  // TODO: 対象のリポジトリをいい感じに編集できるようにする
  const response = UrlFetchApp.fetch('https://api.github.com/repos/kotanin/TestActions/issues?state=all', options);
  const json = response.getContentText();
  const data = JSON.parse(json);

  const today = Date.now()
  data.forEach(issue => {
    // issueにはPRが含まれるので、それを弾く
    if (issue['pull_request'] != undefined) {
      return;
    }

    // 7日以内のIssueを対象に集計する
    const diffDays = (today - Date.parse(issue['updated_at'])) / 86400000;
    if (diffDays <= 7) {
      // PRを立てた人を集計する
      const userName:string = issue['user']['login'];
      const count = map.get(userName) || 0;
      map.set(userName, count + 1);

      // 7日以内にコメントした人を集計する
      const commentResponse = UrlFetchApp.fetch(issue['comments_url'], options);
      const commentJson = commentResponse.getContentText();
      const commentData = JSON.parse(commentJson);
      commentData.forEach(comment => {
        if ((today - Date.parse(comment['updated_at'])) / 86400000 <= 7) {
          const commentUserName = comment['user']['login'];
          const commentCount = map.get(commentUserName) || 0;
          map.set(commentUserName, commentCount + 1);
        }
      });
    }
  });
}
