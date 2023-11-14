use base64::prelude::*;
use js_sys;
use js_sys::JsString;
use lazy_static::lazy_static;
use wasm_bindgen::prelude::*;
use web_sys::{FetchEvent, Response};
use yew::Properties;
use yew::prelude::*;
use yew::LocalServerRenderer;
use std::cmp::PartialEq;


#[derive(Properties, Clone, PartialEq)]
struct AppProperties {
    name: String,
    now: JsString,
}

#[function_component]
fn App(prop: &AppProperties) -> Html {
    
    html! {
        <html>
            <head>
                <title>{ "Hello, hello!" }</title>
            </head>
            <body>
              <h1>{ "Hello, world!!! How are you, "} {&prop.name} {"?"}</h1>
              <h3>{ "The time now is: " }{ &prop.now }</h3>
            </body>
        </html>
    }
}

#[wasm_bindgen(js_name = fetch_listener)]
pub async fn listener(event: &FetchEvent) -> Response {

    let name = event
        .request()
        .headers()
        .get("X-Name")
        .ok()
        .flatten()
        .unwrap_or(String::from("John Smith"));

    let renderer = LocalServerRenderer::<App>::with_props(AppProperties {
        name,
        now: js_sys::Date::new_0().to_json()
    });

    let body = renderer.render().await;

    let response = Response::new_with_opt_str(Some(body.as_str())).unwrap();

    response.headers().set("Content-Type", "text/html").unwrap();

    response
}



