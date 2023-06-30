// GitHubのPersonal Access Tokne
const githubToken: string = userProperties.getProperty('GITHUB_TOKEN') || '';
// 更新取得対象のリポジトリ
const targetRepositories: string[] = (userProperties.getProperty('GITHUB_TARGET_REPOS') || '').split(',');

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

    for (const targetRepository of targetRepositories) {
    // PRを集計する
    correctPr(targetRepository, options, map);

    // Issueを集計する
    correctIssue(targetRepository, options, map);
    }

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

function correctPr(targetRepository: string, options, map: Map<string, number>) {
    // PRの一覧取得
  // TODO: 対象のリポジトリをいい感じに編集できるようにする
  const response = UrlFetchApp.fetch(`https://api.github.com/repos/${targetRepository}/pulls?state=all`, options);
    const json = response.getContentText();
    const data = JSON.parse(json);

    const today = Date.now()
    data.forEach(pr => {
      // 7日以内のPRを対象に集計する
      const diffDays = (today - Date.parse(pr['updated_at'])) / 86400000;
      if (diffDays <= aggregateDate) {
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

function correctIssue(targetRepository: string, options, map: Map<string, number>) {
  // Issueの一覧取得
  // TODO: 対象のリポジトリをいい感じに編集できるようにする
  const response = UrlFetchApp.fetch(`https://api.github.com/repos/${targetRepository}/issues?state=all`, options);
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
    if (diffDays <= aggregateDate) {
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
