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

    let processingFlag = false;
    // 音声入力後の処理
    vosk.subscribe(async (speechText) => {
        if(validateInputText(speechText) && processingFlag == false) {
            console.log(`質問内容: ${speechText}`);
            processingFlag = true;
            // ChatGPTへの問い合わせ
            let sentence = "";
            console.log('-------------------------------------');
            await chatGPT.askStream(speechText, async (word) => {
                sentence += word;
                if (word == "。" || word == "." || word == "！" || word == "\n") {
                    console.log(sentence);
                    await voiceVox.addSpeechQueue(sentence);
                    sentence = "";
                }
            }, chatGPT.MODELS.gpt35_turbo);
            if (sentence.length > 0) await voiceVox.addSpeechQueue(sentence);
            voiceVox.addCallBack(() => {
                // すべてのトークが終わったあと自分自身の声を拾わないように少し待つ。
                setTimeout(() => {
                    processingFlag = false;
                    sentence = "";
                    console.log('-------------------------------------');
                }, 1500);
            });
        }
    });
}

main().then().catch(e => {
    console.log(e);
    throw e;
});