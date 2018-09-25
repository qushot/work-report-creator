class Main {
  public run() {
    const today = new Date();
    Logger.log('today');
    Logger.log(today);

    // 土日・祝日判定
    if (this.isHoliiday(today)) {
      return;
    }

    // ルートフォルダIDを設定
    const driveID = '';
    const parent = DriveApp.getFolderById(driveID);

    // Yearフォルダ
    const yearName = today.getFullYear().toString();
    const yearID = this.getFolderID(parent, yearName);
    Logger.log('yearName');
    Logger.log(yearName);
    Logger.log('yearID');
    Logger.log(yearID);

    // Monthフォルダ
    const monthName = ('0' + (today.getMonth() + 1)).slice(-2);
    const monthID = this.getFolderID(DriveApp.getFolderById(yearID), monthName);
    Logger.log('monthName');
    Logger.log(monthName);
    Logger.log('monthID');
    Logger.log(monthID);

    // 対象のファイルオブジェクトを取得
    const src = this.getSrcFile(parent, today);
    if (src === null) {
      return;
    }

    // ファイルのコピー
    const newFileName =
      monthName + '/' + ('0' + today.getDate()).slice(-2) + '作業メモ';
    const newFile = src.makeCopy(newFileName, DriveApp.getFolderById(monthID));
    Logger.log('newFileID');
    newFile.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    Logger.log(newFile.getId());
    this.noticeSlack(newFile.getUrl());
  }

  /**
   * 実行時の日付から土日・祝日判定を行う
   *
   * @param  {Date} today
   * @returns boolean
   */
  private isHoliiday(today: Date): boolean {
    const weekDay = ['日', '月', '火', '水', '木', '金', '土'];
    const weekInt = today.getDay();
    Logger.log(weekDay[weekInt]);
    if (weekInt <= 0 || 6 <= weekInt) {
      return true;
    }

    const calendarId = 'ja.japanese#holiday@group.v.calendar.google.com';
    const calendar = CalendarApp.getCalendarById(calendarId);
    const todayEvents = calendar.getEventsForDay(today);

    if (todayEvents.length > 0) {
      for (const event of todayEvents) {
        Logger.log('event');
        Logger.log(event.getTitle());
      }

      return true;
    }
    return false;
  }

  /**
   * フォルダを検索・作成し、IDを返す
   *
   * @param  {GoogleAppsScript.Drive.Folder} parent
   * @param  {string} name
   * @returns string
   */
  private getFolderID(
    parent: GoogleAppsScript.Drive.Folder,
    name: string,
  ): string {
    const folders = parent.getFoldersByName(name);

    if (folders.hasNext()) {
      const id = folders.next().getId();
      Logger.log('Exist folder: ' + id);
      return id;
    } else {
      const folder = parent.createFolder(name);
      folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);

      const id = folder.getId();
      Logger.log('Create folder: ' + id);
      return id;
    }
  }

  /**
   * コピー対象のファイルオブジェクトを取得する
   *
   * @param  {GoogleAppsScript.Drive.Folder} parent
   * @param  {Date} today
   * @returns GoogleAppsScript
   */
  private getSrcFile(
    parent: GoogleAppsScript.Drive.Folder,
    today: Date,
  ): GoogleAppsScript.Drive.File | null {
    for (let y = today.getFullYear(); y > 0; y--) {
      const yID = this.getFolderID(parent, y.toString());

      for (let m = today.getMonth() + 1; m > 0; m--) {
        const mName = ('0' + m).slice(-2);
        const mID = this.getFolderID(DriveApp.getFolderById(yID), mName);
        const folder = DriveApp.getFolderById(mID);

        for (let d = 31; d > 0; d--) {
          const dName = ('0' + d).slice(-2);
          const fileName = mName + '/' + dName + '作業メモ';

          const files = folder.getFilesByName(fileName);
          if (files.hasNext()) {
            Logger.log('fileName');
            Logger.log(fileName);
            return files.next();
          }
        }
      }
    }
    return null;
  }

  /**
   * Slackに通知を行う
   *
   * @param  {string} url
   * @returns string
   */
  private noticeSlack(url: string) {
    Logger.log('slack notice');

    const webhookURL = '';

    const payload = {
      icon_emoji: ':pugya:',
      text: '今日の作業メモを作ったぞ！ <' + url + '|ファイルを開く>',
      username: '作業メモ作る君',
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      headers: {
        'content-type': 'application/json',
      },
      method: 'post',
      payload: JSON.stringify(payload),
    };

    UrlFetchApp.fetch(webhookURL, options);
  }
}

function main() {
  new Main().run();
}
