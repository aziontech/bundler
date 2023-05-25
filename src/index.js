const builders = require("./build")

async function main() {
    // options MOCK
    const options = {
        type: "default",
        builder: "webpack"
    }

    // validate args
    // TODO

    // load build context and configs
    let builder;
    switch (options.builder) {
        case "webpack":
            builder = new builders.WebpackBuilder();
            break;
        default:
            builder = new builders.WebpackBuilder();
            break;
    }

    // build options mock
    const buildOptions = {
        entry: "./examples/simple-js"
    }

    // run build
    try {
        await builder.run(buildOptions);
    } catch (error) {
        console.log("Error in build: ", error)
    }
}

main();