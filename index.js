const ChatGPT = require("./libs/chatgpt");
const VoiceVox = require("./libs/voicevox");
const Vosk = require("./libs/vosk");

/**
 * 入力された音声を検証する
 * @param {string} text
 * @returns {boolean} 入力値が処理可能かどうか
 */
const validateInputText = (text) => {
    return text !== null && text.length > 4;
}

const main = async () => {
    // リソースの確保
    const chatGPT = new ChatGPT();
    const voiceVox = new VoiceVox();
    const vosk = new Vosk();

    // 音声入力後の処理
    vosk.subscribe(async (speechText) => {
        if(validateInputText(speechText) && voiceVox.isIdle()) {
            console.log(`質問内容: ${speechText}`);
            // ChatGPTへの問い合わせ
            let sentence = "";
            console.log('-------------------------------------');
            await chatGPT.askStream(speechText, async (word) => {
                sentence += word;
                if (word == "。" || word == ".") {
                    console.log(sentence);
                    await voiceVox.speech(sentence);
                    sentence = "";
                }
            });
            await voiceVox.speech("  "); // 自分の発話を再度拾わないように最後に空白のスピーチを挿入しておく
            console.log('-------------------------------------');
        }
    });
}

main().then().catch(e => {
    console.log(e);
    throw e;
});