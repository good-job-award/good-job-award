// ChatworkのAPIトークン
const chatworkApiToken: string = userProperties.getProperty('CHATWORK_APITOKEN') || '';
// CharworkのルームIDE
const chatworkRoomId: string = userProperties.getProperty('CHATWORK_POST_ROOMID') || '';

function postChatwork(message: string) {
    // メッセージが空の場合は送信処理しない
    if (!message) {
        return;
    }
    // Chatrowk送信のURL
    const baseUrl: string = `https://api.chatwork.com/v2/rooms/${chatworkRoomId}/messages`;
    // Slackに送信するメッセージなどを編集
    const headers: any = {
        'X-Chatworktoken': chatworkApiToken
    };
    const params: any = {
        'body': message,
    }
    const options: any = {
        'method': 'POST',
        'headers' : headers,
        'payload': params
    };
    // 送信処理
    UrlFetchApp.fetch(baseUrl, options);
}