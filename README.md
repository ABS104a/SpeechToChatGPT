# 話した内容をChatGPTが返してくれるやつ
## 依存
- ChatGPT API
- VoiceBox (standalone)
- Vosk (model)
  
## 動作環境
M1 Mac Air (2020)
## 準備
1. 依存するLibを取得します。
```sh
$ npm install
```  
```sh
$ brew install sox
```  
2. voskをDLします。
https://alphacephei.com/vosk/models
`vosk-model-small-ja-0.22` をDLし、本READMEと同じディレクトリに配置します。
  
3. VoiceVoxをインストールします。
https://voicevox.hiroshiba.jp/
インストールしたらアプリケーションを起動し、VoiceVoxのAPIが叩ける状態にしてください。
  
4. openaiのapiキーの取得
https://platform.openai.com/account/api-keys
からキーを取得し、`config.sample.js` を `config.js` としてコピーしキーを入力します。
  
5. 実行
```sh
$ node index.js
```