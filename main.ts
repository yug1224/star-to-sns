import 'https://deno.land/std@0.193.0/dotenv/load.ts';

import getItemList from './src/getItemList.ts';
import getOgp from './src/getOgp.ts';
import postBluesky from './src/postBluesky.ts';
import postWebhook from './src/postWebhook.ts';

// rss feedから記事リストを取得
const itemList = await getItemList();
console.log(JSON.stringify(itemList, null, 2));

// 対象がなかったら終了
if (!itemList.length) {
  console.log('not found feed item');
  Deno.exit(0);
}

// 取得した記事リストをループ処理
for await (const item of itemList) {
  // 最終実行時間を更新
  const timestamp = item.published
    ? new Date(item.published).toISOString()
    : new Date().toISOString();
  await Deno.writeTextFile('.timestamp', timestamp);

  // 投稿記事のプロパティを作成
  const title = item.title?.value || '';
  const link = item.links[0].href || '';
  const text = `${title}\n${link}`;

  // URLからOGPの取得
  const og = await getOgp(link);

  // Blueskyに投稿
  await postBluesky(text, title, link, og);

  // IFTTTを使ってXに投稿
  await postWebhook(text);
}
