const { default: ollama } = require('ollama');

async function testOllama() {
    console.log('🤖 Testing connection to local Ollama instance...');
    
    try {
        const response = await ollama.chat({
            model: 'aleSuglia/qwen2-vl-2b-instruct-q4_k_m:latest',
            messages: [{ role: 'user', content: 'Say hello world in JSON format with a "message" key.' }],
            format: 'json'
        });

        console.log('✅ Success! Ollama is running and responding.');
        console.log('📦 Raw output:', response.message.content);
        
        const parsed = JSON.parse(response.message.content);
        console.log('🧩 Parsed JSON:', parsed);
        
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        console.log('Make sure Ollama is installed and running, and the qwen2-vl:2b model is pulled.');
    }
}

testOllama();
