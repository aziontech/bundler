const path = require("path")

module.exports = {
    output: {
        path: path.join(process.cwd(), "worker"),
        filename: "function.js",
        globalObject: "this",
    },
    mode: "production",
    target: "webworker",
    plugins: []
};