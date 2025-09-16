import { Mistral } from '@mistralai/mistralai';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY; //"RK0Cjbzz6XzAfPrKoa14NJUIcYLivVoT";

const client = new Mistral({apiKey: apiKey});

async function main() {
    const chatResponse = await client.chat.complete({
        model: "mistral-large-latest",
        messages: [{role: 'user', content: 'What is the best French cheese?'}]
    });

    console.log('Chat:', chatResponse.choices?.[0]?.message?.content);
}

main();