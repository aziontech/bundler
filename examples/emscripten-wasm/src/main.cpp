
#include <stdio.h>
#include <emscripten/val.h>


using emscripten::val;

extern "C" const char* fetch_listener(val event) {

    // "fetch" global do JavaScript
    val fetch = val::global("fetch");

    // Obtém um objeto "Response" com o conteudo da URL
    val response = 
        fetch(std::string("https://baconipsum.com/api/?type=meat-and-filler"))
        .await();

    // Converte o objeto "Response" para um objeto JSON, chamando 
    // o método "json()". O objeto JSON é um array de parágrafos.
    val paragraphs = response.call<val>("json").await();

    // Converte o array de parágrafos para uma string, chamando o
    // método "join()" do JavaScript.
    auto answer = paragraphs.call<val>("join").as<std::string>();

    val console = val::global("console");
    console.call<void>("log", "The answer is " + answer);

    return answer.c_str();
}


