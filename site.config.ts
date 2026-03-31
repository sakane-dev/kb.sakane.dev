import { siteConfig } from './lib/site-config'

export default siteConfig({
  // 必須設定
  rootNotionPageId: '3349ee114e2c80cc8330ce43f19a6bd1',

  // サイト情報
  name: 'Yasuyuki Sakane Knowledge Base',
  domain: 'kb.sakane.dev',
  author: 'Yasuyuki Sakane',
  description: 'Trucks of Yasuyuki Sakane’s Structual Intelligence',

  // ソーシャル
  twitter: 'sakane_dev',
  github: 'sakane-dev',
  linkedin: 'yasuyukis',

  // プレビュー画像機能
  isPreviewImageSupportEnabled: true,
})
