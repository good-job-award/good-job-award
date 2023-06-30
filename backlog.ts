const userProperties = PropertiesService.getScriptProperties();
// Backlogのホスト
const backlogHost: string = userProperties.getProperty('BACKLOG_HOST') || '';
// BacklogのAPIキー
const backlogApiKey: string = userProperties.getProperty('BACKLOG_APIKEY') || '';

type BacklogActivity = {
    id: number;
    created: Date;
    createdUser: BacklogUser;
}

type BacklogUser = {
    name: string;
}

const RANKING_SIZE = 3;
const AGGREGATE_DATE = 7;
const FETCH_COUNT = 100;

function getBacklogRanking(): string {
    const activities = fetchBacklogActivities();
    const ranking = new Map<string, number>();
    for (const activity of activities) {
        const key = activity.createdUser.name;
        const value = (ranking.get(key) || 0) + 1;
        ranking.set(key, value);
    }
    const sortedRanking = Array.from(ranking.entries()).sort((r1, r2) => r2[1] - r1[1]);
    const rankSize = sortedRanking.length < RANKING_SIZE ? sortedRanking.length: RANKING_SIZE;
    const rankingStrings: string[] = [];
    rankingStrings.push('Backlog更新ランキング');
    for (let i = 0; i < rankSize; i++) if (i < sortedRanking.length) {
        rankingStrings.push(`${i + 1}位: ${sortedRanking[i][0]} ${sortedRanking[i][1]}pt`);
    }
    return rankingStrings.join('\n');
}

function fetchBacklogActivities(paramMaxId?: number, fetchedActivities?: BacklogActivity[]): BacklogActivity[] {
    const from = new Date();
    from.setHours(0);
    from.setMinutes(0);
    from.setSeconds(0);
    from.setMilliseconds(0);
    from.setDate(from.getDate() - AGGREGATE_DATE);

    const url = `https://${backlogHost}/api/v2/space/activities?apiKey=${backlogApiKey}&count=${FETCH_COUNT}${paramMaxId ? '&maxId=' + paramMaxId: ''}`;
    const response = UrlFetchApp.fetch(url);
    const responseJSON = JSON.parse(response.getContentText());
    const activities: BacklogActivity[] = [];
    let maxId: number = 0;
    for (const activity of responseJSON) {
        const created = new Date(activity.created);
        if (activity.id !== paramMaxId && from <= created) {
            activities.push({
                ...activity,
                created
            });
            maxId = activity.id;
        }
    }
    const concatActivities = fetchedActivities ? fetchedActivities.concat(activities) : activities;
    if (activities.length < FETCH_COUNT) {
        return concatActivities;
    } else {
        return fetchBacklogActivities(maxId, concatActivities);
    }
}