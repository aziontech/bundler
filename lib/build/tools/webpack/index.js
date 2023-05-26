import AzionWebpackConfig from "./webpack.config";

class WebpackBuilder {
    run = () => {
        console.log(`Azion default webpack config = ${AzionWebpackConfig}`);
    }
}

export default WebpackBuilder;