async function github() {      
    var headers = {
      'Authorization': 'Bearer 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',
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    var options = {
        'method' : 'get',
        'headers' : headers
    };

    const map = new Map<string, number>();

    // PRを集計する
    correctPr(headers, options, map);

    // Issueを集計する
    correctIssue(headers, options, map);

    // 集計値出力
    var array = Array.from(map.entries()).sort((r1, r2) => r2[1] - r1[1]);
    console.log('GitHub更新ランキング')
    var position = 1;
    array.forEach(pair => {
      if (position < 3) {
        console.log(position++ + '位: ' + pair[0] + '  ' + pair[1] + "回！");
      }
    });
}

async function correctPr(headers, options, map) {
    // PRの一覧取得
    var response = UrlFetchApp.fetch('https://api.github.com/repos/kotanin/TestActions/pulls?state=all', options);
    var json = response.getContentText();
    var data = JSON.parse(json);

    var today = Date.now()
    data.forEach(pr => {
      // 7日以内のPRを対象に集計する
      var diffDays = (today - Date.parse(pr['updated_at'])) / 86400000;
      if (diffDays <= 7) {
        // PRを立てた人を集計する
        var userName:string = pr['user']['login'];
        var count = map.get(userName);
        if (count == undefined) {
          count = 0;
        }
        map.set(userName, ++count);

        // 7日以内にコメントした人を集計する
        var commentResponse = UrlFetchApp.fetch(pr['comments_url'], options);
        var commentJson = commentResponse.getContentText();
        var commentData = JSON.parse(commentJson);
        commentData.forEach(comment => {
          if ((today - Date.parse(comment['updated_at'])) / 86400000 <= 7) {
            var commentUserName = comment['user']['login'];
            var commentCount = map.get(commentUserName);
            if (commentCount == undefined) {
              commentCount = 0;
            }
            map.set(commentUserName, ++commentCount);
          }
        });
      }
    });
}

async function correctIssue(headers, options, map) {
  // PRの一覧取得
  var response = UrlFetchApp.fetch('https://api.github.com/repos/kotanin/TestActions/issues?state=all', options);
  var json = response.getContentText();
  var data = JSON.parse(json);

  var today = Date.now()
  data.forEach(issue => {
    // issueにはPRが含まれるので、それを弾く
    if (issue['pull_request'] != undefined) {
      return;
    }

    // 7日以内のIssueを対象に集計する
    var diffDays = (today - Date.parse(issue['updated_at'])) / 86400000;
    if (diffDays <= 7) {
      // PRを立てた人を集計する
      var userName:string = issue['user']['login'];
      var count = map.get(userName);
      if (count == undefined) {
        count = 0;
      }
      map.set(userName, ++count);

      // 7日以内にコメントした人を集計する
      var commentResponse = UrlFetchApp.fetch(issue['comments_url'], options);
      var commentJson = commentResponse.getContentText();
      var commentData = JSON.parse(commentJson);
      commentData.forEach(comment => {
        if ((today - Date.parse(comment['updated_at'])) / 86400000 <= 7) {
          var commentUserName = comment['user']['login'];
          var commentCount = map.get(commentUserName);
          if (commentCount == undefined) {
            commentCount = 0;
          }
          map.set(commentUserName, ++commentCount);
        }
      });
    }
  });
}