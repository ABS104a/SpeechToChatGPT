const fs = require("fs");
const axios = require("axios");
const async = require("async");
const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);

const voicevoxConfig = {
    serverUrl: "http://127.0.0.1:50021",
    speakerIndex: 0,
}

const removeAudioFile = () => {
    const regex = /.*\.wav$/
    fs.readdir("./","utf8", (_, files)=>{
        files.filter(one_file => {
            return fs.statSync(one_file).isFile() && regex.test(one_file)
        }).forEach(removeFile => {
            fs.unlinkSync(removeFile);
        })
    })
}

class VoiceVox {

    constructor() {
        this.config = voicevoxConfig;
        this.playingQueue = async.queue(async (obj) => {
            if(typeof obj === 'string') {
                await exec(`afplay ${obj}`);
            } else if (typeof obj === 'function') {
                obj();
            }
        });
        this.playingQueueCount = 0;
        this.abortController = new AbortController();
        process.on('SIGINT', () => {
            console.log("SIGINT_VOICEBOX");
            this.playingQueue.kill();
            this.playingQueueCount = 0;
            this.abortController.abort();
            removeAudioFile();
        });
    }

    addCallBack(callback) {
        this.playingQueue.push(callback);
    }

    async addSpeechQueue(text) {
        try {
            // VOICEVOXでchatGPTからの返答を音声合成
            const queryRes = await axios.post(
                `${this.config.serverUrl}/audio_query?speaker=${this.config.speakerIndex}&text="${text}"`,
                {},
                {
                    signal: this.abortController.signal,
                });
            const res = await axios.post(`${this.config.serverUrl}/synthesis?speaker=${this.config.speakerIndex}`, queryRes.data, {
                    responseType: "arraybuffer",
                    signal: this.abortController.signal,
                });
            //VOICEBOXで生成した音声データをwavで出力してafplayで再生
            if(this.playingQueue.idle()) {
                this.playingQueueCount = 0;
            } else {
                this.playingQueueCount = this.playingQueueCount + 1;
            }
            const fileName = `tmp_voice_${this.playingQueueCount}.wav`;
            await fs.promises.writeFile(fileName, res.data);
            this.playingQueue.push(fileName);
        } catch (err) {
            console.log(`${err.name} : ${err.message}`);
        }
    }
}
module.exports = VoiceVox;