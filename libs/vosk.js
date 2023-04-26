const {setLogLevel, Model, Recognizer } = require("vosk");
const mic = require("mic");

const VoskConfig = {
    SAMPLE_RATE: 16000,
    MODEL_PATH: "./vosk-model-ja-0.22",
}

const isPromise = (obj) => {
    return obj instanceof Promise || (obj && typeof obj.then === 'function');
}

class Vosk {
    constructor() {
        this.config = VoskConfig;
        setLogLevel(0);
        const model = new Model(this.config.MODEL_PATH);
        const rec = new Recognizer({model: model, sampleRate: this.config.SAMPLE_RATE});

        const micInstance = mic({
            rate: String(this.config.SAMPLE_RATE),
            channels: '1',
            debug: false,
            device: 'default',
        });


        const micInputStream = micInstance.getAudioStream();

        micInputStream.on('data', async (data) => {
            if (rec.acceptWaveform(data)) {
                const speechText = rec.result().text;
                if(this.observer && typeof this.observer === 'function') {
                    const promise = this.observer(speechText);
                    if(isPromise(promise)) await promise;
                }
            }
        });

        micInputStream.on('audioProcessExitComplete', () => {
            console.log(rec.finalResult());
            rec.free();
            model.free();
        });

        process.on('SIGINT', () => {
            console.log("SIGINT_VOSK");
            micInstance.stop();
        });

        micInstance.start();
    }

    /**
     * マイクの入力を受けたときの処理を追加する。
     * @param {Function} observer
     */
    subscribe(observer) {
        this.observer = observer;
    }
}
module.exports = Vosk;