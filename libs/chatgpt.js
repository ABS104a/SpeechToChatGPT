
const { Configuration, OpenAIApi } = require("openai");
const config = require("../config");
const { default: axios } = require("axios");

const isPromise = (obj) => {
    return obj instanceof Promise || (obj && typeof obj.then === 'function');
}

class ChatGPT {

    constructor() {
        const conf = new Configuration({
            apiKey: config.apikey,
        });
        this.abortController = new AbortController();
        this.openai = new OpenAIApi(conf);
        process.on('SIGINT', () => {
            console.log("SIGINT_CHATGPT");
            this.abortController.abort();
        });
    }

    async ask(prompt, model = "gpt-3.5-turbo") {
        const result = await this.openai.createChatCompletion({
            model,
            messages: [{role: "user", content: prompt}],
        }, {
            signal: this.abortController.signal,
        });
        return result.data.choices[0].message.content;
    }

    async askStream(prompt, observer, model = "gpt-3.5-turbo") {
        const result = await this.openai.createChatCompletion({
            model,
            messages: [{role: "user", content: prompt}],
            stream: true,
        }, {
            responseType: 'stream',
            signal: this.abortController.signal,
        });

        for await (const chunk of result.data) {
            const lines = chunk
                .toString("utf8")
                .split("\n")
                .filter((line) => line.trim().startsWith("data: "));

            for (const line of lines) {
                const message = line.replace(/^data: /, "");
                if (message === "[DONE]") {
                    return;
                }

                const json = JSON.parse(message);
                const word = json.choices[0].delta.content;
                if (word && observer && typeof observer === 'function') {
                    const promise = observer(word);
                    promise.signal = this.abortController.signal;
                    if(isPromise(promise)) await promise;
                }
            }
        }
    }
}
module.exports = ChatGPT