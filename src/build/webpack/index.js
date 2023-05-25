const webpack = require("webpack")
const AZION_WEBPACK_CONFIG = require("./webpack.config")

class WebpackBuilder {
    generateConfig({ customWebpackConfig, pluginsList, useNodePolyfills, entry }) {
        let config = { ...AZION_WEBPACK_CONFIG }
        config.entry = entry

        if (customWebpackConfig) {
            config = { ...customWebpackConfig, ...config }
        }

        if (pluginsList) {
            config.plugins = [...config.plugins, pluginsList]
        }

        if (useNodePolyfills) {
            // TODO
            console.log("Add node polyfills !")
        }

        return config
    }

    async run(options) {
        const config = this.generateConfig(options)

        const workerCompiler = webpack(config)

        workerCompiler.run((err, stats) => {
            if (err) {
                throw Error("Error in webpack build: ", err)
            }

            const info = stats.toJson()
            if (stats.hasErrors()) {
                for (const msg of info.errors) {
                    console.error(msg)
                }

                throw Error(this.targetDir, "Worker compilation errors")
            }

            console.log("Build done!")
        });
    }
}

module.exports = WebpackBuilder